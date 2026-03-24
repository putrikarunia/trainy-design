import { Badge } from '../../../../components/ui/badge'

export function InferenceHeroGraphic() {
  return (
    <div style={{
    "gap": "-1px",
    "display": "flex",
    "alignItems": "center",
    "flexDirection": "column",
    "justifyContent": "center"
  }}>
      <div style={{
    "paddingTop": "16px",
    "paddingRight": "16px",
    "paddingBottom": "16px",
    "paddingLeft": "16px",
    "gap": "16px",
    "display": "flex",
    "flexDirection": "column",
    "justifyContent": "center",
    "alignItems": "flex-start",
    "width": "400px",
    "maxWidth": "650px",
    "backgroundColor": "#262631"
  }} className="rounded-2xl flex items-center justify-center bg-linear-to-br border border-glow-orange backdrop-blur-[15px] font-mono lg:text-base text-xs to-[#181820] from-[#262631]">
        <div style={{
    "display": "flex",
    "justifyContent": "space-between",
    "alignItems": "center",
    "width": "100%"
  }}>
          <span style={{
    "color": "#a1a1aa",
    "fontSize": "14px"
  }}>
            job.yaml
          </span>
          <div style={{
    "display": "flex",
    "gap": "6px"
  }}>
            <div style={{
    "width": "12px",
    "height": "12px",
    "borderRadius": "50%",
    "backgroundColor": "#3f3f46"
  }}></div>
            <div style={{
    "width": "12px",
    "height": "12px",
    "borderRadius": "50%",
    "backgroundColor": "#3f3f46"
  }}></div>
            <div style={{
    "width": "12px",
    "height": "12px",
    "borderRadius": "50%",
    "backgroundColor": "#3f3f46"
  }}></div>
          </div>
        </div>
        <div style={{
    "display": "flex",
    "flexDirection": "column",
    "gap": "6px"
  }}>
          <p style={{
    "margin": "0",
    "color": "#d4d4d8"
  }}>
            <span style={{"color":"#a1a1aa"}}>
              num_nodes:
            </span>
            <span style={{
    "color": "#facc15",
    "fontWeight": "600"
  }}>
              64
            </span>
          </p>
          <p style={{
    "margin": "0",
    "color": "#d4d4d8"
  }}>
            <span style={{"color":"#a1a1aa"}}>
              accelerators:
            </span>
            <span style={{
    "color": "#93c5fd",
    "fontWeight": "600"
  }}>
              H100:8
            </span>
          </p>
          <p style={{
    "margin": "0",
    "color": "#d4d4d8"
  }}>
            <span style={{"color":"#a1a1aa"}}>
              priority-class:
            </span>
            <span style={{
    "color": "#c4b5fd",
    "fontWeight": "600"
  }}>
              high-priority
            </span>
          </p>
          <p style={{
    "margin": "0",
    "color": "#a1a1aa"
  }}>
            serving:
          </p>
          <p style={{
    "margin": "0",
    "color": "#d4d4d8",
    "paddingLeft": "16px"
  }}>
            <span style={{"color":"#a1a1aa"}}>
              min_replicas:
            </span>
            <span style={{
    "color": "#facc15",
    "fontWeight": "600"
  }}>
              {" "}3
            </span>
          </p>
        </div>
      </div>
      <div style={{
    "width": "2px",
    "height": "40px"
  }} className="from-[#313135] bg-gradient-to-b to-[#ffc267]"></div>
      <div style={{
    "width": "350px",
    "height": "20px"
  }} className="relative flex items-center justify-center border-2 rounded-t-xl border-b-0 border-[#ffc267]"></div>
      <div style={{
    "gap": "24px",
    "display": "flex",
    "flexDirection": "row"
  }}>
        <div style={{
    "gap": "",
    "display": "flex",
    "alignItems": "center",
    "flexDirection": "column",
    "justifyContent": "flex-start"
  }}>
          <div style={{
    "width": "2px",
    "height": "10px"
  }} className="bg-gradient-to-b from-[#ffc267] to-[#ffe7c4]"></div>
          <div style={{
    "width": "150px",
    "border": "1px solid #2a2a2a",
    "height": "150px",
    "backgroundColor": "#1a1a1a",
    "display": "flex",
    "flexDirection": "column",
    "gap": "8px",
    "opacity": "0.7"
  }} className="relative rounded-xl flex items-center justify-center bg-gradient-to-tr shadow-xl from-[#101013] to-[#181820]">
            <span className="text-xl text-muted-foreground">
              8x GPUs
            </span>
            <div style={{
    "rowGap": "10px",
    "display": "flex",
    "padding": "2px 8px",
    "boxSizing": "border-box",
    "columnGap": "10px",
    "borderRadius": "8px",
    "backgroundColor": "rgb(69, 26, 3)"
  }}>
              <div style={{
    "color": "rgb(251, 191, 36)",
    "fontSize": "14px",
    "boxSizing": "border-box",
    "lineHeight": "21px",
    "whiteSpace": "nowrap"
  }}>
                Training
              </div>
            </div>
          </div>
        </div>
        <div style={{
    "gap": "",
    "display": "flex",
    "alignItems": "center",
    "flexDirection": "column",
    "justifyContent": "flex-start",
    "marginTop": "-20px",
    "marginRight": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px"
  }}>
          <div style={{
    "width": "2px",
    "height": "30px",
    "backgroundColor": "#ffc267"
  }} className="bg-gradient-to-b from-[#ffc267] to-[#ffe7c4]"></div>
          <div style={{
    "width": "150px",
    "border": "1px solid #2a2a2a",
    "height": "150px",
    "backgroundColor": "#1a1a1a",
    "display": "flex",
    "flexDirection": "column",
    "gap": "16px",
    "opacity": "0.7"
  }} className="relative rounded-xl flex items-center justify-center bg-gradient-to-tr shadow-xl from-[#101013] to-[#181820]">
            <span className="text-xl text-muted-foreground">
              8x GPUs
            </span>
            <div style={{
    "rowGap": "10px",
    "display": "flex",
    "padding": "2px 8px",
    "boxSizing": "border-box",
    "columnGap": "10px",
    "borderRadius": "8px",
    "backgroundColor": "rgb(69, 26, 3)"
  }}>
              <div style={{
    "color": "rgb(251, 191, 36)",
    "fontSize": "14px",
    "boxSizing": "border-box",
    "lineHeight": "21px",
    "whiteSpace": "nowrap"
  }}>
                Training
              </div>
            </div>
          </div>
        </div>
        <div style={{
    "gap": "",
    "display": "flex",
    "alignItems": "center",
    "flexDirection": "column",
    "justifyContent": "flex-start"
  }}>
          <div style={{
    "width": "2px",
    "height": "10px",
    "backgroundColor": "#ffc267"
  }} className="bg-gradient-to-b from-[#ffc267] to-[#ffe7c4]"></div>
          <div style={{
    "width": "150px",
    "height": "150px",
    "backgroundColor": "#1a1a1a",
    "display": "flex",
    "flexDirection": "column",
    "gap": "16px"
  }} className="relative rounded-xl flex items-center justify-center bg-gradient-to-tr shadow-xl from-[#101013] to-[#181820] border-pink-400 border">
            <span className="text-xl text-muted-foreground">
              8x GPUs
            </span>
            <div style={{
    "rowGap": "10px",
    "display": "flex",
    "padding": "2px 8px",
    "boxSizing": "border-box",
    "columnGap": "10px",
    "borderRadius": "8px"
  }} className="text-pink-400 bg-pink-400/10">
              <div style={{
    "fontSize": "14px",
    "boxSizing": "border-box",
    "lineHeight": "21px",
    "whiteSpace": "nowrap"
  }}>
                Inference
              </div>
            </div>
          </div>
          <div style={{
    "width": "2px",
    "height": "20px"
  }} className="bg-gradient-to-b from-[#41353a] to-[#ff6aa7]"></div>
        </div>
      </div>
      <div style={{
    "display": "flex",
    "flexDirection": "row",
    "gap": "0px",
    "marginTop": "0px",
    "marginRight": "0px",
    "marginBottom": "0px",
    "marginLeft": "174px"
  }}>
        <div style={{
    "width": "89px",
    "height": "20px",
    "marginTop": "18px",
    "marginRight": "0px",
    "marginBottom": "0px",
    "marginLeft": "0px"
  }} className="relative flex items-center justify-center border-2 border-[#ff6aa7] border-b-0 border-r-0 rounded-tl-xl"></div>
        <div style={{
    "width": "87px",
    "height": "20px"
  }} className="relative flex items-center justify-center border-t-0 border-2 border-[#ff6aa7] rounded-br-xl border-l-0"></div>
      </div>
      <div style={{
    "width": "2px",
    "height": "20px"
  }} className="bg-gradient-to-b from-[#ff6aa7] to-[#ffe3ee]"></div>
      <div style={{
    "width": "100%",
    "padding": "24px",
    "backgroundColor": "#262631"
  }} className="relative rounded-xl text-sm leading-relaxed shadow-xl to-[#181820] border font-mono bg-linear-to-br from-[#262631]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="flex-1 text-pink-400">
              llama-70b-serve
            </span>
            <Badge variant="outline" className="">
              <span className="text-emerald-400">
                ●
              </span>
              Live
            </Badge>
          </div>
          <div className="text-gray-300">
            Replicas: 3 → 5 (autoscaling)
          </div>
          <div className="text-gray-300">
            Latency: 42ms  |  1.2K req/sec
          </div>
          <div className="text-gray-300">
            Health: All nodes passing
          </div>
        </div>
      </div>
    </div>
  )
}