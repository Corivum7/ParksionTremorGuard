(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var sevCritical = style.getPropertyValue('--sev-critical').trim();
  var sevHigh = style.getPropertyValue('--sev-high').trim();
  var sevMedium = style.getPropertyValue('--sev-medium').trim();
  var sevLow = style.getPropertyValue('--sev-low').trim();

  // ========== Chart 1: Pain Point Frequency-Severity Matrix ==========
  var chart1El = document.getElementById('chart-pain-matrix');
  if (chart1El) {
    var chart1 = echarts.init(chart1El, null, { renderer: 'svg' });

    var severityMap = { '致命': 4, '高': 3, '中': 2, '低': 1 };
    var severityColors = { '致命': sevCritical, '高': sevHigh, '中': sevMedium, '低': sevLow };

    var painData = [
      { name: '无法回忆震颤分数', freq: 2, severity: '高', impact: 3, theme: '认知负担' },
      { name: '复杂图表难理解', freq: 2, severity: '高', impact: 3, theme: '认知负担' },
      { name: '严重等级选择困难', freq: 1, severity: '中', impact: 2, theme: '认知负担' },
      { name: '量表填写负担重', freq: 1, severity: '高', impact: 3, theme: '记录效率' },
      { name: '记录入口不符认知', freq: 3, severity: '高', impact: 4, theme: '记录效率' },
      { name: '缺少场景上下文', freq: 3, severity: '高', impact: 4, theme: '可见性' },
      { name: '缺少药效窗口对比', freq: 1, severity: '高', impact: 3, theme: '可见性' },
      { name: '提醒在不合适时机', freq: 1, severity: '高', impact: 4, theme: '设备限制' },
      { name: '精细动作困难', freq: 3, severity: '高', impact: 4, theme: '运动限制' },
      { name: '异常被他人发现', freq: 3, severity: '中', impact: 2, theme: '发现延迟' }
    ];

    var seriesData = {};
    painData.forEach(function(p) {
      var sev = p.severity;
      if (!seriesData[sev]) seriesData[sev] = [];
      seriesData[sev].push({
        name: p.name,
        value: [p.freq, severityMap[sev], p.impact],
        itemStyle: { color: severityColors[sev] }
      });
    });

    chart1.setOption({
      animation: false,
      tooltip: {
        appendToBody: true,
        formatter: function(p) {
          return '<b>' + p.data.name + '</b><br/>频次: ' + p.data.value[0] + '/5<br/>严重度: ' +
            ['低','中','高','致命'][p.data.value[1]-1] + '<br/>影响范围: ' + p.data.value[2] + '/4';
        }
      },
      grid: { left: 60, right: 30, top: 40, bottom: 50 },
      xAxis: {
        name: '提及频次 (X/5)',
        nameLocation: 'middle',
        nameGap: 30,
        type: 'value',
        min: 0, max: 5,
        interval: 1,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        nameTextStyle: { color: muted, fontSize: 12 }
      },
      yAxis: {
        name: '严重程度',
        nameLocation: 'middle',
        nameGap: 40,
        type: 'value',
        min: 0.5, max: 4.5,
        interval: 1,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: {
          color: muted,
          fontSize: 11,
          formatter: function(v) {
            return ['','低','中','高','致命'][v] || '';
          }
        },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        nameTextStyle: { color: muted, fontSize: 12 }
      },
      series: Object.keys(seriesData).map(function(sev) {
        return {
          name: sev,
          type: 'scatter',
          symbolSize: function(data) { return data[2] * 18; },
          data: seriesData[sev],
          label: {
            show: true,
            formatter: function(p) {
              var shortName = p.data.name.length > 8 ? p.data.name.substring(0, 7) + '…' : p.data.name;
              return shortName;
            },
            color: ink,
            fontSize: 10,
            position: 'top'
          },
          emphasis: {
            label: { show: true, fontWeight: 'bold' }
          }
        };
      }),
      legend: {
        data: ['高', '中'],
        bottom: 0,
        textStyle: { color: muted, fontSize: 11 },
        itemWidth: 12, itemHeight: 12
      }
    });

    window.addEventListener('resize', function() { chart1.resize(); });
  }

  // ========== Chart 2: Participant-Pain Point Heatmap ==========
  var chart2El = document.getElementById('chart-heatmap');
  if (chart2El) {
    var chart2 = echarts.init(chart2El, null, { renderer: 'svg' });

    var participants = ['A', 'B', 'C', 'D', 'E'];
    var painPoints = [
      '无法回忆分数',
      '复杂图表难懂',
      '等级选择困难',
      '量表负担重',
      '入口不符认知',
      '缺场景上下文',
      '缺药效对比',
      '提醒时机不当',
      '精细动作困难',
      '异常被他人发现'
    ];

    // 1 = explicitly mentioned, 0.5 = implied, 0 = not mentioned
    var heatData = [];
    var matrix = [
      // A   B    C    D    E
      [  1,  0,   1,   0,   0 ],  // 无法回忆分数
      [  1,  0,   1,   0,   0 ],  // 复杂图表难懂
      [  0,  1,   0,   0,   0 ],  // 等级选择困难
      [  0,  0,   1,   0,   0 ],  // 量表负担重
      [  0,  1,   1,   1,   0 ],  // 入口不符认知
      [  1,  1,   0,   1,   0 ],  // 缺场景上下文
      [  0,  0,   0,   0,   1 ],  // 缺药效对比
      [  0,  0,   0,   0,   1 ],  // 提醒时机不当
      [  1,  0,   1,   1,   0 ],  // 精细动作困难
      [  1,  1,   1,   0,   0 ]   // 异常被他人发现
    ];

    matrix.forEach(function(row, pi) {
      row.forEach(function(val, ci) {
        heatData.push([ci, pi, val]);
      });
    });

    chart2.setOption({
      animation: false,
      tooltip: {
        appendToBody: true,
        formatter: function(p) {
          var status = p.value[2] === 1 ? '明确提及' : (p.value[2] === 0.5 ? '隐含提及' : '未提及');
          return '参与者 ' + participants[p.value[0]] + ' × ' + painPoints[p.value[1]] + '<br/>状态: ' + status;
        }
      },
      grid: { left: 130, right: 40, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: participants,
        name: '参与者',
        nameLocation: 'middle',
        nameGap: 25,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 13, fontWeight: 'bold' },
        splitArea: { show: false },
        nameTextStyle: { color: muted, fontSize: 12 }
      },
      yAxis: {
        type: 'category',
        data: painPoints,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink, fontSize: 11 },
        splitArea: { show: false }
      },
      visualMap: {
        min: 0, max: 1,
        show: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 12, itemHeight: 80,
        textStyle: { color: muted, fontSize: 10 },
        inRange: { color: [bg2, accent2 + '88', accent] },
        text: ['明确提及', '未提及'],
        calculable: false
      },
      series: [{
        type: 'heatmap',
        data: heatData,
        label: {
          show: true,
          formatter: function(p) {
            if (p.value[2] === 1) return '●';
            if (p.value[2] === 0.5) return '◐';
            return '';
          },
          color: '#fff',
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: { borderRadius: 4, borderColor: bg2, borderWidth: 2 }
      }]
    });

    window.addEventListener('resize', function() { chart2.resize(); });
  }

  // ========== Chart 3: Feature Priority Ranking ==========
  var chart3El = document.getElementById('chart-priority');
  if (chart3El) {
    var chart3 = echarts.init(chart3El, null, { renderer: 'svg' });

    var features = [
      { name: '场景优先记录入口', freq: 4, severity: 3, score: 12, level: 'must' },
      { name: '极简交互设计', freq: 3, severity: 3, score: 9, level: 'must' },
      { name: '对比式震颤摘要', freq: 3, severity: 3, score: 9, level: 'must' },
      { name: '情境感知渐进提醒', freq: 1, severity: 3, score: 7, level: 'must' },
      { name: '药效窗口对比', freq: 1, severity: 3, score: 7, level: 'must' },
      { name: '拍照场景证据', freq: 1, severity: 2, score: 4, level: 'optional' },
      { name: '就诊导出打印', freq: 1, severity: 2, score: 4, level: 'optional' }
    ];

    var levelColors = {
      'must': accent,
      'optional': accent2
    };

    chart3.setOption({
      animation: false,
      tooltip: {
        appendToBody: true,
        formatter: function(p) {
          var f = features[p.dataIndex];
          return '<b>' + f.name + '</b><br/>频次: ' + f.freq + '/5<br/>严重度: ' +
            ['','低','中','高'][f.severity] + '<br/>优先级分数: ' + f.score +
            '<br/>分类: ' + (f.level === 'must' ? '必须项 (v1)' : '可选项');
        }
      },
      grid: { left: 160, right: 60, top: 20, bottom: 40 },
      xAxis: {
        name: '优先级分数 (频次 × 严重度)',
        nameLocation: 'middle',
        nameGap: 25,
        type: 'value',
        min: 0, max: 14,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        nameTextStyle: { color: muted, fontSize: 11 }
      },
      yAxis: {
        type: 'category',
        data: features.map(function(f) { return f.name; }).reverse(),
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink, fontSize: 12 },
        splitArea: { show: false }
      },
      series: [{
        type: 'bar',
        data: features.map(function(f) {
          return { value: f.score, itemStyle: { color: levelColors[f.level], borderRadius: [0, 4, 4, 0] } };
        }).reverse(),
        barWidth: 20,
        label: {
          show: true,
          position: 'right',
          color: ink,
          fontSize: 12,
          fontWeight: 'bold',
          formatter: function(p) { return p.value; }
        }
      }],
      legend: {
        data: [
          { name: '必须项 (v1)', icon: 'rect', itemStyle: { color: accent } },
          { name: '可选项', icon: 'rect', itemStyle: { color: accent2 } }
        ],
        bottom: 0,
        textStyle: { color: muted, fontSize: 11 }
      }
    });

    window.addEventListener('resize', function() { chart3.resize(); });
  }

})();
