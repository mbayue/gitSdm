import mermaid from 'mermaid';

// Initialize mermaid with custom dark theme variables and premium styling overrides
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  themeVariables: {
    background: '#09090b',
    primaryColor: '#6d28d9',
    primaryTextColor: '#f4f4f5',
    lineColor: '#3f3f46',
    nodeBorder: '#3f3f46',
    mainBkg: '#18181b',
    actorBkg: '#18181b',
    actorBorder: '#3f3f46',
    actorTextColor: '#f4f4f5',
    signalColor: '#a1a1aa',
    signalLineColor: '#3f3f46',
    labelBoxBkgColor: '#18181b',
    labelBoxBorderColor: '#3f3f46',
    labelTextColor: '#f4f4f5',
    loopBkgColor: '#18181b',
    loopBorderColor: '#3f3f46',
    noteBkgColor: '#18181b',
    noteBorderColor: '#3f3f46',
    noteTextColor: '#f4f4f5',
  },
  themeCSS: `
    .node rect, .node polygon, .node circle, .node path {
      fill: #18181b;
      stroke: #3f3f46;
      stroke-width: 1.5px;
      rx: 8px;
      ry: 8px;
      transition: all 0.2s ease-in-out;
    }
    
    .node:hover rect, .node:hover polygon, .node:hover circle, .node:hover path {
      fill: #242427 !important;
      stroke: #8b5cf6 !important;
      filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.45));
      cursor: pointer;
    }

    .edgePath .path {
      stroke: #52525b !important;
      stroke-width: 1.5px !important;
      transition: all 0.2s ease-in-out;
    }
    .edgePath:hover .path {
      stroke: #a78bfa !important;
      stroke-width: 2px !important;
    }
    .edgePath .markerPath {
      fill: #52525b !important;
      stroke: none !important;
      transition: all 0.2s ease-in-out;
    }
    .edgePath:hover .markerPath {
      fill: #a78bfa !important;
    }

    .cluster rect {
      fill: rgba(24, 24, 27, 0.2) !important;
      stroke: rgba(63, 63, 70, 0.4) !important;
      stroke-width: 1.5px !important;
      rx: 12px !important;
      ry: 12px !important;
    }
    .cluster-label, .cluster-label text, .cluster-label span, .cluster-label div, .cluster-label p, .cluster-label a, .cluster-label a:visited, .cluster-label a:hover {
      fill: #e4e4e7 !important;
      color: #e4e4e7 !important;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif !important;
      font-weight: 600 !important;
      font-size: 11px !important;
      letter-spacing: 0.05em !important;
      text-transform: uppercase !important;
      text-decoration: none !important;
    }
    .cluster-label {
      translate: 0 8px !important;
    }
    .cluster-label foreignObject div, .cluster-label p {
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .node text, .node .label, .node .label text, .node .label div, .node .label span, .node span, .node div, .node a, .node a:visited, .node a:hover {
      color: #f4f4f5 !important;
      fill: #f4f4f5 !important;
      font-family: 'Inter', system-ui, sans-serif !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      text-decoration: none !important;
    }

    .node.entry rect, .node.entry polygon {
      fill: #1e1b4b !important;
      stroke: #8b5cf6 !important;
      stroke-width: 2px !important;
    }
    .node.router rect, .node.router polygon {
      fill: #064e3b !important;
      stroke: #10b981 !important;
    }
    .node.service rect, .node.service polygon {
      fill: #172554 !important;
      stroke: #3b82f6 !important;
    }
    .node.util rect, .node.util polygon {
      fill: #18181b !important;
      stroke: #71717a !important;
    }
    .node.db rect, .node.db polygon {
      fill: #581c87 !important;
      stroke: #d946ef !important;
    }
    .node.config rect, .node.config polygon {
      fill: #451a03 !important;
      stroke: #f59e0b !important;
    }
    .node.test rect, .node.test polygon {
      fill: #0c4a6e !important;
      stroke: #0284c7 !important;
    }
  `,
});

export default mermaid;
