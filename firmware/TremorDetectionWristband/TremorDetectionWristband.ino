/*
 * =============================================================================
 *  TremorGuard - Tremor Detection Wristband Firmware (v2: Feature Pipeline)
 *  Target Board : Seeed Studio XIAO ESP32C3  (ESP32-C3, 32-bit RISC-V, WiFi+BLE)
 *  Sensor       : InvenSense TDK MPU-6050 (3-axis accelerometer + 3-axis gyroscope)
 *  Framework    : Arduino IDE with ESP32 Arduino core
 *  File         : TremorDetectionWristband.ino
 * =============================================================================
 *  OFFICIAL DATA-SHEET REFERENCES
 *   [1] Seeed Studio XIAO ESP32C3 Getting Started / Pin Map
 *       https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/
 *   [2] InvenSense / TDK, "MPU-6000 and MPU-6050 Register Map and
 *       Descriptions", Document RM-MPU-6000A-00, Revision 4.2 (2013).
 *   [3] Hssayeni MD, et al. "Wearable Sensors for Estimation of Parkinsonian
 *       Tremor Severity during Free Body Movements." Sensors. 2019;19(19):4215.
 *       https://www.mdpi.com/1424-8220/19/19/4215
 *   [4] Sica M, et al. "Continuous home monitoring of Parkinson's disease
 *       using inertial sensors: A systematic review." PLoS ONE. 2021.
 * =============================================================================
 *  HARDWARE WIRING
 *   -----------------------------------------------------------------------
 *    XIAO ESP32C3          MPU-6050 module        Notes
 *   -----------------------------------------------------------------------
 *    3V3  (3.3V output) -> VCC                    3.3V logic supply (safe)
 *    GND                -> GND                    Common ground
 *    D4   (GPIO6, SDA)  -> SDA                    I2C data line
 *    D5   (GPIO7, SCL)  -> SCL                    I2C clock line
 *    (MPU-6050 AD0 pin tied to GND)               => I2C 7-bit address 0x68
 *   -----------------------------------------------------------------------
 *  IMPORTANT: On the XIAO ESP32C3 the I2C bus is on D4/D5. Pins D6/D7 are the
 *  UART TX/RX, NOT I2C (a common wiring mistake). See the official pin map [1].
 * =============================================================================
 *  DATA PROCESSING PIPELINE (v2)
 *   Sampling    : 62.5 Hz (16 ms interval), 256 samples per analysis window
 *   Window      : 256 samples = 4.096 seconds  [3 recommends >=5s; 256-point
 *                 FFT requires power-of-2; 4 s is sufficient for 4-6 Hz]
 *   FFT         : 256-point radix-2 Cooley-Tukey on detrended gyro magnitude
 *   Filtering   : Three-layer — activity detection, amplitude lower limit,
 *                 amplitude upper limit (see Section C for details)
 *   Output      : One feature line per window + one hour-summary line per hour
 *
 *  SERIAL OUTPUT FORMAT (115200 baud)
 *   Window feature line (every ~4 seconds):
 *     W:#<id> F:<freq>Hz P:<power> RMS_G:<gx,gy,gz> RMS_A:<ax,ay,az>
 *     P2P:<p2p> R:<0|1> T:<0|1> ACT:<0-3> BAT:<pct>
 *   Hour summary line (every hour):
 *     H:#<hour> TC:<count> AVG:<g> PK:<g> PKT:<min> DUR:<min> ON:<min>
 *     FAVG:<hz> ANOM:<count>
 * =============================================================================
 */

#include <Wire.h>
#include <math.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>

/* ===========================================================================
 *  CONFIGURATION & CONSTANTS
 * =========================================================================== */

// ---- I2C pins for the XIAO ESP32C3 (Seeed pin map [1]) ----
static const uint8_t  I2C_SDA_PIN  = D4;       // GPIO6
static const uint8_t  I2C_SCL_PIN  = D5;       // GPIO7
static const uint32_t I2C_FREQ_HZ  = 400000;   // Fast Mode 400 kHz

// ---- Serial ----
static const uint32_t SERIAL_BAUD  = 115200;

// ---- MPU-6050 I2C address ----
static const uint8_t MPU6050_ADDR_LOW  = 0x68;
static const uint8_t MPU6050_ADDR_HIGH = 0x69;
static uint8_t       MPU6050_ADDR      = MPU6050_ADDR_LOW;

// ---- Sampling parameters [3] ----
// 62.5 Hz polling (16 ms interval). 256 samples = 4.096 s window.
// Nyquist = 31.25 Hz, well above the 4-6 Hz tremor band [3,4].
// Frequency resolution = 62.5 / 256 = 0.244 Hz per FFT bin.
static const uint32_t SAMPLE_INTERVAL_MS = 16;     // 62.5 Hz
static const uint16_t WINDOW_SIZE        = 256;    // power-of-2 for FFT
static const float    SAMPLE_RATE_HZ     = 62.5f;
static const float    FREQ_RESOLUTION    = SAMPLE_RATE_HZ / WINDOW_SIZE;  // 0.244 Hz

// ---- Tremor band parameters ----
// Parkinsonian resting tremor: 4-6 Hz [3,4]. FFT bins covering this band:
//   4 Hz / 0.244 = bin 16.4  ->  bins 16..25 cover 3.9..6.1 Hz
static const uint16_t TREMOR_BIN_LO = 16;   // ~3.9 Hz
static const uint16_t TREMOR_BIN_HI = 25;   // ~6.1 Hz
static const float    TREMOR_FREQ_LO = 4.0f;
static const float    TREMOR_FREQ_HI = 6.0f;

// ---- Three-layer filter thresholds ----
// Filter 1: Activity detection — accel low-freq RMS > 0.3 g => active movement
static const float ACTIVITY_THRESHOLD_G = 0.3f;
// Filter 2: Amplitude lower limit — gyro 4-6 Hz band RMS < 5 dps => noise
static const float TREMOR_MIN_RMS_DPS = 5.0f;
// Filter 3: Amplitude upper limit — accel instantaneous > 1.8 g => impact
static const float IMPACT_THRESHOLD_G = 1.8f;

/* ===========================================================================
 *  MPU-6050 REGISTER DEFINITIONS  (RM-MPU-6000A-00 Rev 4.2 [2])
 * =========================================================================== */
static const uint8_t REG_SMPLRT_DIV   = 0x19;
static const uint8_t REG_CONFIG       = 0x1A;
static const uint8_t REG_GYRO_CONFIG  = 0x1B;
static const uint8_t REG_ACCEL_CONFIG = 0x1C;
static const uint8_t REG_ACCEL_XOUT_H = 0x3B;
static const uint8_t REG_PWR_MGMT_1   = 0x6B;
static const uint8_t REG_WHO_AM_I     = 0x75;

static const uint8_t MPU6050_WHO_AM_I = 0x68;

/* ---------------------------------------------------------------------------
 *  FULL-SCALE RANGE & SENSITIVITY  [2, sections 4.4 / 4.5]
 * ------------------------------------------------------------------------- */
static const uint8_t ACCEL_FS_SEL    = 0;            // +/-2 g
static const float   ACCEL_LSB_PER_G = 16384.0f;
static const float   ACCEL_SCALE     = 1.0f / ACCEL_LSB_PER_G;

static const uint8_t GYRO_FS_SEL     = 0;            // +/-250 deg/s
static const float   GYRO_LSB_PER_DPS = 131.0f;
static const float   GYRO_SCALE      = 1.0f / GYRO_LSB_PER_DPS;

// ---- Hour summary timing ----
static const uint32_t MS_PER_HOUR = 3600000UL;

/* ===========================================================================
 *  DATA STRUCTURES
 * =========================================================================== */

struct RawSample {
  int16_t ax, ay, az;
  int16_t gx, gy, gz;
  int16_t temp;
};

struct PhysSample {
  float ax_g, ay_g, az_g;
  float gx_dps, gy_dps, gz_dps;
  float temp_c;
};

// Circular buffer for one analysis window of gyro + accel data.
struct WindowBuffer {
  float gx[WINDOW_SIZE];    // gyro X in deg/s
  float gy[WINDOW_SIZE];    // gyro Y in deg/s
  float gz[WINDOW_SIZE];    // gyro Z in deg/s
  float ax[WINDOW_SIZE];    // accel X in g
  float ay[WINDOW_SIZE];    // accel Y in g
  float az[WINDOW_SIZE];    // accel Z in g
  uint16_t count;           // samples filled so far (0..WINDOW_SIZE)
  uint32_t windowId;        // monotonically increasing window counter
};

// Feature sample extracted from one analysis window.
struct FeatureSample {
  uint32_t timestamp;           // millis() at window completion
  uint32_t windowId;
  float    dominantFreqHz;      // peak frequency in 1-15 Hz range
  float    tremorBandPower;     // 4-6 Hz band power (sum of squared magnitudes)
  float    totalPower;          // total spectral power (1-15 Hz)
  float    rmsGyroX, rmsGyroY, rmsGyroZ;  // gyro RMS per axis (deg/s)
  float    rmsAccelX, rmsAccelY, rmsAccelZ; // accel RMS per axis (g)
  float    peakToPeakGyro;      // max gyro magnitude - min gyro magnitude
  bool     isResting;           // true if low activity
  bool     isTremor;            // true if tremor detected (freq 4-6 Hz + amplitude)
  bool     isAnomaly;           // true if impact detected (>1.8 g instantaneous)
  uint8_t  activityLevel;       // 0=resting, 1=minor, 2=moderate, 3=active
};

// Hourly summary aggregated from feature samples.
struct HourSummary {
  uint32_t hourStartMs;         // millis() at hour start
  uint16_t tremorCount;         // number of tremor windows
  float    avgAmplitude;        // mean gyro RMS of tremor windows (deg/s)
  float    peakAmplitude;       // max gyro RMS across all windows (deg/s)
  uint16_t peakTimeOffsetMin;   // minutes into the hour of peak (0-59)
  float    tremorDurationMin;   // tremorCount * window duration
  float    onStateDurationMin;  // resting + tremor duration (ON estimate)
  float    dominantFreqAvg;     // mean dominant freq of tremor windows
  uint8_t  anomalyCount;        // number of anomaly (impact) windows
  uint16_t totalWindows;        // total windows processed this hour
};

/* ===========================================================================
 *  GLOBAL STATE
 * =========================================================================== */
static WindowBuffer gWindow;
static uint32_t     gLastSampleMs = 0;
static HourSummary  gHour;
static uint32_t     gHourStartMs  = 0;

// FFT working arrays (reused across windows to avoid allocation)
static float gFFT_re[WINDOW_SIZE];
static float gFFT_im[WINDOW_SIZE];

/* ===========================================================================
 *  SECTION A - HARDWARE INITIALIZATION
 * =========================================================================== */

static bool mpuWriteByte(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(reg);
  Wire.write(value);
  return (Wire.endTransmission() == 0);
}

static bool mpuReadBytes(uint8_t reg, uint8_t n, uint8_t *buf) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) {
    return false;
  }
  if (Wire.requestFrom((int)MPU6050_ADDR, (int)n) != n) {
    return false;
  }
  for (uint8_t i = 0; i < n; i++) {
    buf[i] = Wire.read();
  }
  return true;
}

/* initMPU6050 : wake sensor, set 100 Hz internal rate, DLPF, ranges [2]. */
static void initMPU6050(void) {
  mpuWriteByte(REG_PWR_MGMT_1, 0x80);   // DEVICE_RESET
  delay(100);
  mpuWriteByte(REG_PWR_MGMT_1, 0x00);   // wake (SLEEP=0)
  delay(10);
  mpuWriteByte(REG_PWR_MGMT_1, 0x01);   // CLKSEL=1 (PLL with X-gyro)
  delay(1);

  // Internal sample rate: 1 kHz / (1+9) = 100 Hz (>= 62.5 Hz poll rate)
  mpuWriteByte(REG_SMPLRT_DIV, 0x09);

  // DLPF_CFG=3 -> ~44 Hz bandwidth (keeps 4-6 Hz, rejects high-freq noise)
  mpuWriteByte(REG_CONFIG, 0x03);

  mpuWriteByte(REG_GYRO_CONFIG,  (uint8_t)(GYRO_FS_SEL  << 3));
  mpuWriteByte(REG_ACCEL_CONFIG, (uint8_t)(ACCEL_FS_SEL << 3));
}

static bool isKnownIMU(uint8_t who) {
  return (who == 0x68) || (who == 0x69) || (who >= 0x70 && who <= 0x73);
}

static void scanI2CBus(void) {
  Serial.println(F("Scanning I2C bus (1..126)..."));
  uint8_t found = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      uint8_t who = 0xFF;
      Wire.beginTransmission(addr);
      Wire.write(REG_WHO_AM_I);
      Wire.endTransmission(false);
      if (Wire.requestFrom((int)addr, 1) == 1) {
        who = Wire.read();
      }
      Serial.print(F("  -> 0x"));
      if (addr < 16) Serial.print('0');
      Serial.print(addr, HEX);
      Serial.print(F("  WHO_AM_I=0x"));
      if (who < 16) Serial.print('0');
      Serial.println(who, HEX);
      found++;
    }
  }
  if (found == 0) {
    Serial.println(F("  (no devices responded)"));
  }
  Serial.println();
}

static bool detectMPU6050(void) {
  const uint8_t candidates[2] = { MPU6050_ADDR_LOW, MPU6050_ADDR_HIGH };
  for (uint8_t i = 0; i < 2; i++) {
    uint8_t addr = candidates[i];
    uint8_t who = 0xFF;
    Wire.beginTransmission(addr);
    Wire.write(REG_WHO_AM_I);
    if (Wire.endTransmission(false) != 0) {
      continue;
    }
    if (Wire.requestFrom((int)addr, 1) != 1) {
      continue;
    }
    who = Wire.read();
    Serial.print(F("  Probe 0x"));
    if (addr < 16) Serial.print('0');
    Serial.print(addr, HEX);
    Serial.print(F(" -> WHO_AM_I=0x"));
    if (who < 16) Serial.print('0');
    Serial.println(who, HEX);
    if (isKnownIMU(who)) {
      MPU6050_ADDR = addr;
      return true;
    }
  }
  return false;
}

/* ===========================================================================
 *  SECTION B - DATA ACQUISITION
 * =========================================================================== */

static bool readRawSample(RawSample &s) {
  uint8_t b[14];
  if (!mpuReadBytes(REG_ACCEL_XOUT_H, 14, b)) {
    return false;
  }
  s.ax   = (int16_t)((b[0]  << 8) | b[1]);
  s.ay   = (int16_t)((b[2]  << 8) | b[3]);
  s.az   = (int16_t)((b[4]  << 8) | b[5]);
  s.temp = (int16_t)((b[6]  << 8) | b[7]);
  s.gx   = (int16_t)((b[8]  << 8) | b[9]);
  s.gy   = (int16_t)((b[10] << 8) | b[11]);
  s.gz   = (int16_t)((b[12] << 8) | b[13]);
  return true;
}

static void convertToPhysical(const RawSample &raw, PhysSample &out) {
  out.ax_g  = (float)raw.ax * ACCEL_SCALE;
  out.ay_g  = (float)raw.ay * ACCEL_SCALE;
  out.az_g  = (float)raw.az * ACCEL_SCALE;
  out.gx_dps = (float)raw.gx * GYRO_SCALE;
  out.gy_dps = (float)raw.gy * GYRO_SCALE;
  out.gz_dps = (float)raw.gz * GYRO_SCALE;
  out.temp_c = (float)raw.temp / 340.0f + 36.53f;
}

/* ===========================================================================
 *  SECTION C - DSP: FFT, FEATURE EXTRACTION, THREE-LAYER FILTERING
 * ===========================================================================
 *
 *  Three-layer filter pipeline (per window):
 *
 *  Layer 1 - Activity detection:
 *    Compute low-frequency RMS of accelerometer magnitude.
 *    If RMS > 0.3 g  => active movement (walking, eating, etc.)
 *    Active windows: is_resting=false, is_tremor=false (skip tremor eval)
 *
 *  Layer 2 - Amplitude lower limit:
 *    Compute gyro 4-6 Hz band RMS from FFT.
 *    If band RMS < 5 deg/s  => noise / negligible tremor
 *    Set is_tremor=false
 *
 *  Layer 3 - Amplitude upper limit:
 *    Check raw accelerometer peaks during the window.
 *    If any sample > 1.8 g  => impact event (collision, fall, slap)
 *    Set is_anomaly=true, is_tremor=false (excluded from tremor stats)
 * =========================================================================== */

/* fft256 : in-place radix-2 Cooley-Tukey FFT, N must be power of 2.
 * Operates on gFFT_re[] (real) and gFFT_im[] (imaginary) globals.
 * After completion, gFFT_re[k] + j*gFFT_im[k] is the k-th frequency bin. */
static void fft256(void) {
  const uint16_t N = WINDOW_SIZE;

  // --- Bit-reversal permutation ---
  for (uint16_t i = 1, j = 0; i < N; i++) {
    uint16_t bit = N >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      float tr = gFFT_re[i]; gFFT_re[i] = gFFT_re[j]; gFFT_re[j] = tr;
      float ti = gFFT_im[i]; gFFT_im[i] = gFFT_im[j]; gFFT_im[j] = ti;
    }
  }

  // --- Cooley-Tukey butterflies ---
  for (uint16_t len = 2; len <= N; len <<= 1) {
    float angle = -2.0f * M_PI / (float)len;
    float wlenRe = cosf(angle);
    float wlenIm = sinf(angle);
    for (uint16_t i = 0; i < N; i += len) {
      float wRe = 1.0f, wIm = 0.0f;
      for (uint16_t j = 0; j < len / 2; j++) {
        uint16_t a = i + j;
        uint16_t b = a + len / 2;
        float vRe = gFFT_re[b] * wRe - gFFT_im[b] * wIm;
        float vIm = gFFT_re[b] * wIm + gFFT_im[b] * wRe;
        gFFT_re[b] = gFFT_re[a] - vRe;
        gFFT_im[b] = gFFT_im[a] - vIm;
        gFFT_re[a] = gFFT_re[a] + vRe;
        gFFT_im[a] = gFFT_im[a] + vIm;
        float nwRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nwRe;
      }
    }
  }
}

/* computeRMS : root-mean-square of a float array. */
static float computeRMS(const float *data, uint16_t n) {
  float sumSq = 0.0f;
  for (uint16_t i = 0; i < n; i++) {
    sumSq += data[i] * data[i];
  }
  return sqrtf(sumSq / (float)n);
}

/* computeMean : arithmetic mean of a float array. */
static float computeMean(const float *data, uint16_t n) {
  float sum = 0.0f;
  for (uint16_t i = 0; i < n; i++) {
    sum += data[i];
  }
  return sum / (float)n;
}

/* detrend : subtract the mean from a float array (in-place).
 * Removes the DC / gravity component so the FFT captures only oscillations. */
static void detrend(float *data, uint16_t n) {
  float mean = computeMean(data, n);
  for (uint16_t i = 0; i < n; i++) {
    data[i] -= mean;
  }
}

/* applyHanning : multiply data by a Hanning window to reduce spectral leakage. */
static void applyHanning(float *data, uint16_t n) {
  for (uint16_t i = 0; i < n; i++) {
    data[i] *= 0.5f * (1.0f - cosf(2.0f * M_PI * (float)i / (float)(n - 1)));
  }
}

/* extractFeatures : run the full DSP pipeline on the filled window buffer and
 * populate a FeatureSample. This is the core per-window processing function. */
static void extractFeatures(const WindowBuffer &wb, FeatureSample &feat) {
  uint16_t N = WINDOW_SIZE;

  // ---- Time-domain features ----
  feat.rmsGyroX = computeRMS(wb.gx, N);
  feat.rmsGyroY = computeRMS(wb.gy, N);
  feat.rmsGyroZ = computeRMS(wb.gz, N);
  feat.rmsAccelX = computeRMS(wb.ax, N);
  feat.rmsAccelY = computeRMS(wb.ay, N);
  feat.rmsAccelZ = computeRMS(wb.az, N);

  // Gyro vector magnitude per sample (for peak-to-peak and FFT)
  float gyroMag[WINDOW_SIZE];
  float accelMag[WINDOW_SIZE];
  float gyroMin = 1e9f, gyroMax = -1e9f;
  float accelMaxInst = 0.0f;     // for impact detection (Layer 3)

  for (uint16_t i = 0; i < N; i++) {
    // Gyro magnitude (rotation speed)
    gyroMag[i] = sqrtf(wb.gx[i]*wb.gx[i] + wb.gy[i]*wb.gy[i] + wb.gz[i]*wb.gz[i]);
    if (gyroMag[i] < gyroMin) gyroMin = gyroMag[i];
    if (gyroMag[i] > gyroMax) gyroMax = gyroMag[i];

    // Accel vector magnitude (for activity + impact)
    accelMag[i] = sqrtf(wb.ax[i]*wb.ax[i] + wb.ay[i]*wb.ay[i] + wb.az[i]*wb.az[i]);
    if (accelMag[i] > accelMaxInst) accelMaxInst = accelMag[i];
  }
  feat.peakToPeakGyro = gyroMax - gyroMin;

  // ---- Layer 3: Amplitude upper limit (impact detection) ----
  // If any instantaneous accel magnitude exceeds threshold => impact event
  feat.isAnomaly = (accelMaxInst > IMPACT_THRESHOLD_G);

  // ---- Layer 1: Activity detection ----
  // Low-frequency RMS of accel magnitude: detrend then compute RMS.
  // High RMS => active movement (walking, waving, etc.)
  detrend(accelMag, N);
  float accelRMS = computeRMS(accelMag, N);

  uint8_t actLevel;
  if (accelRMS < 0.1f)       actLevel = 0;  // resting
  else if (accelRMS < 0.3f)  actLevel = 1;  // minor movement
  else if (accelRMS < 0.6f)  actLevel = 2;  // moderate
  else                       actLevel = 3;  // active
  feat.activityLevel = actLevel;
  feat.isResting = (actLevel == 0);

  // ---- Frequency-domain features (FFT on gyro magnitude) ----
  // Detrend + Hanning window to reduce spectral leakage
  for (uint16_t i = 0; i < N; i++) {
    gFFT_re[i] = gyroMag[i];
    gFFT_im[i] = 0.0f;
  }
  // Detrend is already done above for gyroMag? No — we detrended accelMag.
  // Detrend gyroMag now:
  detrend(gFFT_re, N);
  applyHanning(gFFT_re, N);
  fft256();

  // Compute magnitude spectrum and find dominant frequency (1-15 Hz)
  // Bin k corresponds to frequency k * FREQ_RESOLUTION
  // 1 Hz -> bin 4,  15 Hz -> bin 61
  float maxMag = 0.0f;
  uint16_t maxBin = 0;
  float totalPower = 0.0f;
  float tremorBandPower = 0.0f;

  for (uint16_t k = 4; k <= 61 && k < N / 2; k++) {  // 1-15 Hz range
    float mag = sqrtf(gFFT_re[k]*gFFT_re[k] + gFFT_im[k]*gFFT_im[k]);
    float power = gFFT_re[k]*gFFT_re[k] + gFFT_im[k]*gFFT_im[k];
    totalPower += power;
    if (k >= TREMOR_BIN_LO && k <= TREMOR_BIN_HI) {
      tremorBandPower += power;
    }
    if (mag > maxMag) {
      maxMag = mag;
      maxBin = k;
    }
  }

  feat.dominantFreqHz = (float)maxBin * FREQ_RESOLUTION;
  feat.tremorBandPower = tremorBandPower;
  feat.totalPower = totalPower;

  // ---- Layer 2: Amplitude lower limit ----
  // Compute RMS of the gyro in the 4-6 Hz band from band power
  // band RMS = sqrt(bandPower / N)  (proportional to band energy)
  float tremorBandRMS = sqrtf(tremorBandPower / (float)N);

  // ---- Combined tremor decision ----
  // Tremor if:
  //   1. NOT an anomaly (no impact)
  //   2. NOT active (activity level <= 1, allows resting + minor)
  //   3. Dominant frequency in 4-6 Hz
  //   4. Band RMS exceeds lower threshold
  bool freqInBand = (feat.dominantFreqHz >= TREMOR_FREQ_LO &&
                     feat.dominantFreqHz <= TREMOR_FREQ_HI);
  feat.isTremor = (!feat.isAnomaly &&
                   actLevel <= 1 &&
                   freqInBand &&
                   tremorBandRMS >= TREMOR_MIN_RMS_DPS);

  feat.timestamp = millis();
  feat.windowId  = wb.windowId;
}

/* ===========================================================================
 *  SECTION D - HOUR SUMMARY AGGREGATION
 * =========================================================================== */

/* resetHourSummary : clear the accumulator for a new hour. */
static void resetHourSummary(uint32_t hourStartMs) {
  gHour.hourStartMs       = hourStartMs;
  gHour.tremorCount       = 0;
  gHour.avgAmplitude      = 0.0f;
  gHour.peakAmplitude     = 0.0f;
  gHour.peakTimeOffsetMin = 0;
  gHour.tremorDurationMin = 0.0f;
  gHour.onStateDurationMin = 0.0f;
  gHour.dominantFreqAvg   = 0.0f;
  gHour.anomalyCount      = 0;
  gHour.totalWindows      = 0;
}

/* updateHourSummary : accumulate one feature sample into the current hour.
 * Called after every window feature extraction. */
static void updateHourSummary(const FeatureSample &feat, const WindowBuffer &wb) {
  gHour.totalWindows++;

  // Track peak amplitude (max gyro vector RMS across all windows)
  float gyroVecRMS = sqrtf(feat.rmsGyroX*feat.rmsGyroX +
                           feat.rmsGyroY*feat.rmsGyroY +
                           feat.rmsGyroZ*feat.rmsGyroZ);
  if (gyroVecRMS > gHour.peakAmplitude) {
    gHour.peakAmplitude = gyroVecRMS;
    // Minutes since hour start
    uint32_t elapsed = (feat.timestamp - gHour.hourStartMs) / 60000UL;
    gHour.peakTimeOffsetMin = (uint16_t)(elapsed > 59 ? 59 : elapsed);
  }

  if (feat.isAnomaly) {
    gHour.anomalyCount++;
  }

  if (feat.isTremor) {
    gHour.tremorCount++;
    // Accumulate for averaging (use gyro vector RMS as amplitude)
    gHour.avgAmplitude += gyroVecRMS;
    gHour.dominantFreqAvg += feat.dominantFreqHz;
  }

  // ON state estimate: resting or tremor (not active movement, not anomaly)
  if ((feat.isResting || feat.isTremor) && !feat.isAnomaly) {
    // Each window = WINDOW_SIZE / SAMPLE_RATE_HZ seconds
    gHour.onStateDurationMin += (float)WINDOW_SIZE / SAMPLE_RATE_HZ / 60.0f;
  }
}

/* finalizeHourSummary : compute final averages when the hour ends. */
static void finalizeHourSummary(void) {
  if (gHour.tremorCount > 0) {
    gHour.avgAmplitude    /= (float)gHour.tremorCount;
    gHour.dominantFreqAvg /= (float)gHour.tremorCount;
  }
  float windowMin = (float)WINDOW_SIZE / SAMPLE_RATE_HZ / 60.0f;
  gHour.tremorDurationMin = (float)gHour.tremorCount * windowMin;
}

/* ===========================================================================
 *  SECTION E - SERIAL OUTPUT
 * =========================================================================== */

/* printFeature : output one window feature line to serial.
 *   W:#42 F:5.2Hz P:123.4 RMS_G:8.5,7.2,9.1 RMS_A:0.03,0.02,0.04
 *   P2P:22.3 R:1 T:1 ACT:0 BAT:82 */
static void printFeature(const FeatureSample &f) {
  Serial.print(F("W:#"));
  Serial.print(f.windowId);
  Serial.print(F(" F:"));
  Serial.print(f.dominantFreqHz, 1);
  Serial.print(F("Hz P:"));
  Serial.print(f.tremorBandPower, 1);
  Serial.print(F(" RMS_G:"));
  Serial.print(f.rmsGyroX, 1); Serial.print(',');
  Serial.print(f.rmsGyroY, 1); Serial.print(',');
  Serial.print(f.rmsGyroZ, 1);
  Serial.print(F(" RMS_A:"));
  Serial.print(f.rmsAccelX, 3); Serial.print(',');
  Serial.print(f.rmsAccelY, 3); Serial.print(',');
  Serial.print(f.rmsAccelZ, 3);
  Serial.print(F(" P2P:"));
  Serial.print(f.peakToPeakGyro, 1);
  Serial.print(F(" R:"));
  Serial.print(f.isResting ? '1' : '0');
  Serial.print(F(" T:"));
  Serial.print(f.isTremor ? '1' : '0');
  Serial.print(F(" ACT:"));
  Serial.print(f.activityLevel);
  Serial.print(F(" ANOM:"));
  Serial.print(f.isAnomaly ? '1' : '0');
  Serial.println();
}

/* printHourSummary : output the hour summary line.
 *   H:#14 TC:24 AVG:8.5dps PK:15.2dps PKT:32 DUR:2.0min ON:45.0min FAVG:5.2Hz ANOM:1 */
static void printHourSummary(const HourSummary &h) {
  Serial.print(F("H:#"));
  Serial.print((h.hourStartMs / MS_PER_HOUR));
  Serial.print(F(" TC:"));
  Serial.print(h.tremorCount);
  Serial.print(F(" AVG:"));
  Serial.print(h.avgAmplitude, 1);
  Serial.print(F("dps PK:"));
  Serial.print(h.peakAmplitude, 1);
  Serial.print(F("dps PKT:"));
  Serial.print(h.peakTimeOffsetMin);
  Serial.print(F("min DUR:"));
  Serial.print(h.tremorDurationMin, 1);
  Serial.print(F("min ON:"));
  Serial.print(h.onStateDurationMin, 1);
  Serial.print(F("min FAVG:"));
  Serial.print(h.dominantFreqAvg, 1);
  Serial.print(F("Hz ANOM:"));
  Serial.print(h.anomalyCount);
  Serial.print(F(" TW:"));
  Serial.print(h.totalWindows);
  Serial.println();
}

/* ===========================================================================
 *  SECTION F - NETWORK CONFIGURATION (SoftAP + Captive Portal)
 * ===========================================================================
 *
 *  Non-blocking state machine for WiFi provisioning:
 *
 *  NET_BOOT             Read NVS -> decide STA connect or enter AP portal
 *  NET_STA_CONNECTING   Try stored credentials (non-blocking, 10s timeout)
 *  NET_AP_PORTAL        SoftAP "TremorGuard-XXXX" at 192.168.4.1 + DNS captive
 *  NET_AP_STA_CONNECTING  User submitted new creds, try connect (AP still up)
 *  NET_RUNNING          STA connected, AP closed, sampling continues
 *
 *  Key: NVS is written ONLY after WL_CONNECTED. On failure, original creds
 *  are preserved. Sampling at 62.5 Hz never blocks during any state.
 * =========================================================================== */

// ---- Network configuration constants ----
static const char*    NVS_NAMESPACE           = "tremorguard_net";
static const char*    AP_SSID_PREFIX          = "TremorGuard-";
static const char*    AP_PASSWORD             = NULL;  // open AP for easy onboarding
static const uint8_t  AP_CHANNEL              = 1;
static const uint8_t  AP_MAX_CONN             = 1;
static const uint32_t WIFI_CONNECT_TIMEOUT_MS = 10000; // 10 s per attempt
static const uint8_t  WIFI_MAX_ATTEMPTS       = 3;
static const uint8_t  DNS_PORT                = 53;
static const IPAddress AP_IP(192, 168, 4, 1);
static const IPAddress AP_MASK(255, 255, 255, 0);

// NVS key names
static const char* NVS_KEY_SSID       = "ssid";
static const char* NVS_KEY_PASS       = "pass";
static const char* NVS_KEY_SERVER     = "server";
static const char* NVS_KEY_CONFIGURED = "configured";

// ---- Network state machine ----
enum NetState {
  NET_BOOT,              // startup: read NVS, decide next step
  NET_STA_CONNECTING,    // try stored credentials (STA mode)
  NET_AP_PORTAL,         // SoftAP config portal active
  NET_AP_STA_CONNECTING, // user submitted creds, trying (AP stays up)
  NET_RUNNING            // normal operation (STA connected, AP closed)
};

struct NetConfig {
  String ssid;
  String password;
  String serverAddress;
  bool   configured;
};

struct NetManager {
  NetState  state;
  NetConfig pendingConfig;  // submitted via web, awaiting validation
  NetConfig storedConfig;   // saved in NVS
  uint32_t  stateEnterMs;   // timestamp entering current state
  uint8_t   connectAttempts;
  uint32_t  lastReconnectMs;
  char      deviceCode[8];  // 4 hex + null
  char      apSsid[24];    // "TremorGuard-XXXX"
};

// ---- Global instances ----
static NetManager netMgr;
static DNSServer  dnsServer;
static WebServer  webServer(80);

// ---- Config page HTML (stored in flash via PROGMEM) ----
static const char CONFIG_HTML[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TremorGuard 配网</title>
<style>
  body{font-family:sans-serif;margin:0;padding:20px;background:#f8fafc;color:#0f172a}
  .card{max-width:400px;margin:0 auto;background:#fff;padding:24px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  h1{font-size:20px;color:#0d9488;margin:0 0 8px}
  p.sub{color:#64748b;font-size:14px;margin:0 0 20px}
  label{display:block;font-size:14px;font-weight:600;margin:12px 0 4px}
  input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:16px}
  button{width:100%;margin-top:20px;padding:12px;background:#0d9488;color:#fff;border:0;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer}
  .status{margin-top:16px;padding:12px;border-radius:8px;font-size:14px;display:none}
  .ok{background:#dcfce7;color:#16a34a}
  .err{background:#fee2e2;color:#dc2626}
</style>
</head>
<body>
<div class="card">
  <h1>TremorGuard 设备配置</h1>
  <p class="sub">请输入 WiFi 网络信息</p>
  <form id="cfg" action="/save" method="POST">
    <label for="ssid">WiFi 名称 (SSID)</label>
    <input id="ssid" name="ssid" type="text" required maxlength="32">
    <label for="pass">WiFi 密码</label>
    <input id="pass" name="pass" type="password" maxlength="64">
    <label for="server">服务器地址</label>
    <input id="server" name="server" type="text" placeholder="http://192.168.1.100:8000" required maxlength="128">
    <button type="submit">保存并连接</button>
  </form>
  <div id="status" class="status"></div>
</div>
<script>
document.getElementById('cfg').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=e.target.querySelector('button');
  btn.disabled=true;btn.textContent='连接中...';
  const st=document.getElementById('status');
  st.style.display='block';st.className='status';st.textContent='正在连接 WiFi...';
  try{
    const r=await fetch('/save',{method:'POST',body:new FormData(e.target)});
    const t=await r.text();
    if(r.ok){
      st.className='status ok';st.textContent='连接成功！设备正在切换网络...';
    }else{
      st.className='status err';st.textContent='连接失败：'+t+'，请重试';
      btn.disabled=false;btn.textContent='保存并连接';
    }
  }catch(err){
    st.className='status err';st.textContent='请求失败，请重试';
    btn.disabled=false;btn.textContent='保存并连接';
  }
});
</script>
</body>
</html>
)HTML";

/* generateDeviceCode : derive 4-hex short code from last 2 MAC bytes. */
static void generateDeviceCode(char* out, size_t len) {
  uint64_t mac = ESP.getEfuseMac();
  uint8_t macBytes[6];
  for (int i = 0; i < 6; i++) {
    macBytes[i] = (uint8_t)((mac >> ((5 - i) * 8)) & 0xFF);
  }
  snprintf(out, len, "%02X%02X", macBytes[4], macBytes[5]);
}

/* loadNetConfig : read saved credentials from NVS.
 * Returns true only if configured=true AND ssid is non-empty. */
static bool loadNetConfig(NetConfig &cfg) {
  Preferences prefs;
  if (!prefs.begin(NVS_NAMESPACE, true)) {  // read-only
    return false;
  }
  cfg.ssid          = prefs.getString(NVS_KEY_SSID, "");
  cfg.password      = prefs.getString(NVS_KEY_PASS, "");
  cfg.serverAddress = prefs.getString(NVS_KEY_SERVER, "");
  cfg.configured    = prefs.getBool(NVS_KEY_CONFIGURED, false);
  prefs.end();
  return cfg.configured && cfg.ssid.length() > 0;
}

/* saveNetConfig : persist credentials to NVS.
 * Called ONLY after WL_CONNECTED is confirmed. */
static bool saveNetConfig(const NetConfig &cfg) {
  Preferences prefs;
  if (!prefs.begin(NVS_NAMESPACE, false)) {  // read-write
    return false;
  }
  prefs.putString(NVS_KEY_SSID, cfg.ssid);
  prefs.putString(NVS_KEY_PASS, cfg.password);
  prefs.putString(NVS_KEY_SERVER, cfg.serverAddress);
  prefs.putBool(NVS_KEY_CONFIGURED, true);
  prefs.end();
  return true;
}

/* startSoftAP : configure AP mode + captive DNS portal. */
static void startSoftAP(const char* ssid) {
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(AP_IP, AP_IP, AP_MASK);
  WiFi.softAP(ssid, AP_PASSWORD, AP_CHANNEL, 0, AP_MAX_CONN);
  // Captive portal: resolve all domains to 192.168.4.1
  dnsServer.start(DNS_PORT, "*", AP_IP);
}

/* stopSoftAP : tear down DNS + AP. */
static void stopSoftAP() {
  dnsServer.stop();
  WiFi.softAPdisconnect(true);
}

/* handleRoot : serve the configuration HTML page. */
static void handleRoot() {
  webServer.send(200, "text/html", CONFIG_HTML);
}

/* handleSave : accept form submission, trigger non-blocking connect.
 * Does NOT write NVS yet — only after WL_CONNECTED in the state machine. */
static void handleSave() {
  if (!webServer.hasArg("ssid") || !webServer.hasArg("server")) {
    webServer.send(400, "text/plain", "缺少必填字段");
    return;
  }
  netMgr.pendingConfig.ssid          = webServer.arg("ssid");
  netMgr.pendingConfig.password      = webServer.arg("pass");
  netMgr.pendingConfig.serverAddress = webServer.arg("server");

  // Switch to AP+STA so user can still reach the page during connect attempt
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(netMgr.pendingConfig.ssid.c_str(),
             netMgr.pendingConfig.password.c_str());
  netMgr.connectAttempts = 1;
  netMgr.state = NET_AP_STA_CONNECTING;
  netMgr.stateEnterMs = millis();

  webServer.send(202, "text/plain", "正在连接，请稍候...");
}

/* handleStatus : return connection status as JSON for polling. */
static void handleStatus() {
  String json = "{\"connected\":";
  json += (WiFi.status() == WL_CONNECTED) ? "true" : "false";
  json += "}";
  webServer.send(200, "application/json", json);
}

/* handleNotFound : captive portal — redirect all unknown paths to root. */
static void handleNotFound() {
  webServer.sendHeader("Location", "http://192.168.4.1/", true);
  webServer.send(302, "text/plain", "");
}

/* netStateMachine : non-blocking WiFi provisioning state machine.
 * Called every loop() iteration. Never blocks sampling. */
static void netStateMachine() {
  uint32_t now = millis();

  switch (netMgr.state) {

    case NET_BOOT: {
      bool hasConfig = loadNetConfig(netMgr.storedConfig);
      if (hasConfig) {
        WiFi.mode(WIFI_STA);
        WiFi.begin(netMgr.storedConfig.ssid.c_str(),
                   netMgr.storedConfig.password.c_str());
        netMgr.connectAttempts = 1;
        netMgr.state = NET_STA_CONNECTING;
        netMgr.stateEnterMs = now;
        Serial.println(F("[NET] 尝试使用已存凭证连接..."));
      } else {
        netMgr.state = NET_AP_PORTAL;
        netMgr.stateEnterMs = now;
        Serial.println(F("[NET] 无已存配置，进入配网模式"));
      }
      break;
    }

    case NET_STA_CONNECTING: {
      if (WiFi.status() == WL_CONNECTED) {
        netMgr.state = NET_RUNNING;
        netMgr.lastReconnectMs = now;
        Serial.print(F("[NET] 连接成功，IP: "));
        Serial.println(WiFi.localIP());
      } else if (now - netMgr.stateEnterMs >= WIFI_CONNECT_TIMEOUT_MS) {
        Serial.print(F("[NET] 连接超时 (第 "));
        Serial.print(netMgr.connectAttempts);
        Serial.println(F(" 次)"));
        if (netMgr.connectAttempts < WIFI_MAX_ATTEMPTS) {
          netMgr.connectAttempts++;
          WiFi.disconnect();
          delay(100);  // brief, well within sampling tolerance
          WiFi.begin(netMgr.storedConfig.ssid.c_str(),
                     netMgr.storedConfig.password.c_str());
          netMgr.stateEnterMs = now;
        } else {
          Serial.println(F("[NET] 达到最大重试次数，进入配网模式"));
          netMgr.state = NET_AP_PORTAL;
          netMgr.stateEnterMs = now;
        }
      }
      break;
    }

    case NET_AP_PORTAL: {
      // Start SoftAP once on entry
      if (netMgr.connectAttempts != 0xFF) {
        WiFi.disconnect();
        startSoftAP(netMgr.apSsid);
        webServer.on("/", HTTP_GET, handleRoot);
        webServer.on("/save", HTTP_POST, handleSave);
        webServer.on("/status", HTTP_GET, handleStatus);
        webServer.onNotFound(handleNotFound);
        webServer.begin();
        netMgr.connectAttempts = 0xFF;  // mark AP started
        Serial.print(F("[NET] SoftAP 已开启: "));
        Serial.print(netMgr.apSsid);
        Serial.print(F("  IP: "));
        Serial.println(WiFi.softAPIP());
      }
      dnsServer.processNextRequest();
      webServer.handleClient();
      break;
    }

    case NET_AP_STA_CONNECTING: {
      // Keep serving the portal while attempting STA connection
      dnsServer.processNextRequest();
      webServer.handleClient();

      if (WiFi.status() == WL_CONNECTED) {
        // Success: persist to NVS, shut down AP, switch to pure STA
        Serial.println(F("[NET] 新凭证连接成功，写入 NVS"));
        saveNetConfig(netMgr.pendingConfig);
        netMgr.storedConfig = netMgr.pendingConfig;
        stopSoftAP();
        WiFi.mode(WIFI_STA);
        netMgr.state = NET_RUNNING;
        netMgr.lastReconnectMs = now;
        Serial.print(F("[NET] 运行中，IP: "));
        Serial.println(WiFi.localIP());
      } else if (now - netMgr.stateEnterMs >= WIFI_CONNECT_TIMEOUT_MS) {
        // Failure: preserve original creds, return to portal
        Serial.println(F("[NET] 新凭证连接失败，保留原配置"));
        WiFi.disconnect();
        WiFi.mode(WIFI_AP);
        WiFi.softAPConfig(AP_IP, AP_IP, AP_MASK);
        WiFi.softAP(netMgr.apSsid, AP_PASSWORD, AP_CHANNEL, 0, AP_MAX_CONN);
        netMgr.state = NET_AP_PORTAL;
        netMgr.connectAttempts = 0xFF;
        netMgr.stateEnterMs = now;
      }
      break;
    }

    case NET_RUNNING: {
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println(F("[NET] 连接丢失，尝试重连"));
        WiFi.reconnect();
        netMgr.lastReconnectMs = now;
      }
      break;
    }
  }
}

/* ===========================================================================
 *  Arduino entry points
 * =========================================================================== */

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(200);
  Serial.println();
  Serial.println(F("=== TremorGuard Wristband v2 | Feature Pipeline ==="));
  Serial.println(F("    MPU6050 on XIAO ESP32C3 | 62.5Hz | 256-pt FFT"));

  // --- I2C ---
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(100000);
  delay(150);

  // --- Detect sensor ---
  Serial.println(F("Detecting MPU6050..."));
  if (!detectMPU6050()) {
    Serial.println(F("MPU6050 NOT FOUND at 0x68/0x69."));
    Serial.println(F("Running I2C bus scan to diagnose:"));
    scanI2CBus();
    Serial.println(F("Check wiring: SDA->D4(GPIO6), SCL->D5(GPIO7)."));
    while (true) { delay(1000); }
  }
  Serial.print(F("MPU6050 at 0x"));
  Serial.println(MPU6050_ADDR, HEX);
  Wire.setClock(I2C_FREQ_HZ);

  // --- Configure sensor ---
  initMPU6050();
  Serial.println(F("Init done. Accel:+/-2g Gyro:+/-250dps DLPF:44Hz"));

  // --- Init window buffer ---
  gWindow.count    = 0;
  gWindow.windowId = 0;

  // --- Init hour summary ---
  gHourStartMs = millis();
  resetHourSummary(gHourStartMs);

  // --- Print config ---
  Serial.print(F("Window: "));
  Serial.print(WINDOW_SIZE);
  Serial.print(F(" samples @ "));
  Serial.print(SAMPLE_RATE_HZ, 1);
  Serial.print(F("Hz = "));
  Serial.print((float)WINDOW_SIZE / SAMPLE_RATE_HZ, 1);
  Serial.println(F("s per window"));
  Serial.print(F("Filters: ACT>"));
  Serial.print(ACTIVITY_THRESHOLD_G, 1);
  Serial.print(F("g | TMIN>"));
  Serial.print(TREMOR_MIN_RMS_DPS, 0);
  Serial.print(F("dps | IMPACT>"));
  Serial.print(IMPACT_THRESHOLD_G, 1);
  Serial.println(F("g"));
  Serial.println(F("--- Streaming feature data ---"));
  Serial.println();

  // --- Network manager init (non-blocking; state machine runs in loop) ---
  generateDeviceCode(netMgr.deviceCode, sizeof(netMgr.deviceCode));
  snprintf(netMgr.apSsid, sizeof(netMgr.apSsid), "%s%s",
           AP_SSID_PREFIX, netMgr.deviceCode);
  netMgr.state           = NET_BOOT;
  netMgr.connectAttempts = 0;
  netMgr.stateEnterMs    = millis();

  Serial.print(F("Device Code: "));
  Serial.println(netMgr.deviceCode);
  Serial.println(F("--- 启动网络管理 ---"));

  gLastSampleMs = millis();
}

void loop() {
  uint32_t now = millis();

  // --- Network state machine (non-blocking; never interrupts sampling) ---
  netStateMachine();

  // --- Check if a new hour has elapsed ---
  if (now - gHourStartMs >= MS_PER_HOUR) {
    finalizeHourSummary();
    printHourSummary(gHour);
    Serial.println();
    gHourStartMs = now;
    resetHourSummary(gHourStartMs);
  }

  // --- Sample at 62.5 Hz (16 ms interval) ---
  if (now - gLastSampleMs >= SAMPLE_INTERVAL_MS) {
    gLastSampleMs = now;

    RawSample raw;
    if (!readRawSample(raw)) {
      return;   // I2C error; skip this sample
    }

    PhysSample phys;
    convertToPhysical(raw, phys);

    // --- Push into window buffer ---
    uint16_t idx = gWindow.count;
    gWindow.gx[idx] = phys.gx_dps;
    gWindow.gy[idx] = phys.gy_dps;
    gWindow.gz[idx] = phys.gz_dps;
    gWindow.ax[idx] = phys.ax_g;
    gWindow.ay[idx] = phys.ay_g;
    gWindow.az[idx] = phys.az_g;
    gWindow.count++;

    // --- When window is full, extract features ---
    if (gWindow.count >= WINDOW_SIZE) {
      gWindow.windowId++;

      FeatureSample feat;
      extractFeatures(gWindow, feat);

      // Update hour summary
      updateHourSummary(feat, gWindow);

      // Output feature line
      printFeature(feat);

      // Reset window for next cycle
      gWindow.count = 0;
    }
  }
}
