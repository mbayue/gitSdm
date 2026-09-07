import mermaid from "mermaid";

export function configureMermaid(theme: "light" | "dark") {
  const dark = theme === "dark";
  const background = dark ? "#1e1e1e" : "#ffffff";
  const surface = dark ? "#252526" : "#f3f3f3";
  const foreground = dark ? "#d4d4d4" : "#333333";
  const muted = dark ? "#a6a6a6" : "#616161";
  const border = dark ? "#3c3c3c" : "#d4d4d4";
  const accent = dark ? "#3794ff" : "#006ab1";
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "strict",
    htmlLabels: false,
    flowchart: {
      useMaxWidth: true,
      htmlLabels: false,
    },
    themeVariables: {
      background,
      primaryColor: accent,
      primaryTextColor: foreground,
      lineColor: border,
      nodeBorder: border,
      mainBkg: surface,
      actorBkg: surface,
      actorBorder: border,
      actorTextColor: foreground,
      signalColor: muted,
      signalLineColor: border,
      labelBoxBkgColor: surface,
      labelBoxBorderColor: border,
      labelTextColor: foreground,
      loopBkgColor: surface,
      loopBorderColor: border,
      noteBkgColor: surface,
      noteBorderColor: border,
      noteTextColor: foreground,
    },
    themeCSS: `
 	    .node rect, .node polygon, .node circle, .node path {
      fill: ${surface};
      stroke: ${border};
      stroke-width: 1.5px;
      rx: 8px;
      ry: 8px;
      transition: all 0.2s ease-in-out;
    }
    
 	    .node:hover rect, .node:hover polygon, .node:hover circle, .node:hover path {
      fill: ${dark ? "#37373d" : "#e8e8e8"} !important;
      stroke: ${accent} !important;
      filter: drop-shadow(0 0 8px ${border});
      cursor: pointer;
    }

    .edgePath .path {
      stroke: ${muted} !important;
      stroke-width: 1.5px !important;
      transition: all 0.2s ease-in-out;
    }
    .edgePath:hover .path {
      stroke: ${accent} !important;
      stroke-width: 2px !important;
    }
    .edgePath .markerPath {
      fill: ${muted} !important;
      stroke: none !important;
      transition: all 0.2s ease-in-out;
    }
    .edgePath:hover .markerPath {
      fill: ${accent} !important;
    }

    .cluster rect {
      fill: ${background} !important;
      stroke: ${border} !important;
      stroke-width: 1.5px !important;
      rx: 12px !important;
      ry: 12px !important;
    }
    .cluster-label, .cluster-label text, .cluster-label span, .cluster-label div, .cluster-label p, .cluster-label a, .cluster-label a:visited, .cluster-label a:hover {
      fill: ${foreground} !important;
      color: ${foreground} !important;
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

    .node text, .node .label, .node .label text, .node .label div, .node .label span, .node span, .node div, .node a, .node a:visited, .node a:hover,
    .nodeLabel, .nodeLabel tspan, .label, .label text, .label tspan {
      color: ${foreground} !important;
      fill: ${foreground} !important;
      font-family: 'Inter', system-ui, sans-serif !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      text-decoration: none !important;
    }

    .nodeLabel {
      pointer-events: none !important;
    }

    .node.entry rect, .node.entry polygon {
      fill: ${dark ? "#123524" : "#e2f3e8"} !important;
      stroke: #10b981 !important;
      stroke-width: 2px !important;
    }
    .node.router rect, .node.router polygon {
      fill: ${surface} !important;
      stroke: ${border} !important;
    }
    .node.service rect, .node.service polygon {
      fill: ${surface} !important;
      stroke: ${muted} !important;
    }
    .node.util rect, .node.util polygon {
      fill: ${surface} !important;
      stroke: ${muted} !important;
    }
    .node.db rect, .node.db polygon {
      fill: ${dark ? "#452b13" : "#fff2dc"} !important;
      stroke: #d97706 !important;
    }
    .node.config rect, .node.config polygon {
      fill: ${surface} !important;
      stroke: ${muted} !important;
    }
    .node.test rect, .node.test polygon {
      fill: ${surface} !important;
      stroke: ${muted} !important;
    }
  `,
  });

  return mermaid;
}
