class Calendar {
    constructor(selector, dataset) {
        this.selector = selector;
        this.dataset = dataset;

        this.x = null;
        this.xAxis = null;
        this.gx = null;
        
        this.calendar = null;
        this.calWidth = null;
        this.calHeight = null;
        this.zoom = null;
        this.newX = null;

        // Stack abstraction
        let piles = 1;
        this.pileHeight = 55;

        // config
        this.leftPadding = 250;
        this.timelineBaseline = 50;

        this.buildMilestoneRadius = 3;
        this.buildMilestoneMinY = this.timelineBaseline + 45;

        // init setup
        this.setup();
    }

    timelineHeight(pilesNumber) {
        return (( pilesNumber - 1 ) * this.pileHeight) + 152;
    }

    setup() {
        this.calendar = d3.select(this.selector);
        this.calendarHeight = this.calendar.style("height").split("px")[0];
        this.calendarWidth = this.calendar.style("width").split("px")[0];
      
        this.configTimeScale();
        this.configCalendarZoom();

        this.platformList = this.calendar.append("g")
            .attr("transform", this.translate(0, 20))
            .attr("class", "platform-list");
    }

    configTimeScale() {
        this.x = d3.scaleTime()
        .domain(this.getTimeScaleDomain(this.dataset))
        .range([this.leftPadding, this.calendarWidth]);
  
        this.xAxis = d3.axisTop(this.x).tickSize(-(this.calendarHeight - 20));
    
        this.gX = this.calendar.append("g")
            .attr("class", "x-axis")
            .attr("height", this.calendarHeight)
            .call(this.xAxis)
            .attr('transform', this.translate(0, 20))
            .attr('text-anchor', 'start');
    }

    configCalendarZoom() {
        this.zoom = d3.zoom().on("zoom", this.onCalendarZoom.bind(this));
        // const zoom = d3.zoom()
        //   .scaleExtent([1, 40])
        //   .translateExtent([[-100, -100], [calendarWidth + 90, calendarHeight + 100]])
        //   .on("zoom", zoomed);
      
        this.calendar.call(this.zoom);
    }

    onCalendarZoom() {
        // Rescale the time scale
        this.newX = d3.event.transform.rescaleX(this.x);
        this.gX.call(this.xAxis.scale(this.newX));

        // outside milestones
        d3.selectAll("g.milestone").attr('transform', m => {
            return this.translate(this.newX(m.date) - this.leftPadding, this.timelineBaseline)
        });
      
        // build milestones
        d3.selectAll("g.build__milestone").attr('transform', m => {
            return this.translate(newX(m.date) - this.leftPadding, this.buildMilestoneMinY)
        });
      
        // Builds
        const self = this;
        d3.selectAll("g.build").each(function (build) {
          const minDate = d3.min(build.milestones,  m => m.date);
          const maxDate = d3.max(build.milestones,  m => m.date);
        
          const positions = { 
            x: self.newX(minDate) - self.leftPadding - self.buildMilestoneRadius, 
            y: self.timelineBaseline - 15
          };
        
          const width = newX(maxDate) - newX(minDate) + (2 * self.buildMilestoneRadius);
      
          d3.select(this).attr("transform", translate(positions.x, positions.y));
          d3.select(this).select("foreignObject").attr("width", width);
        });
    }

    update() {
        const platforms = this.createPlatformList(this.platformList);
        
        // render timelines

        const timelines = this.createTimelineLists(platforms);
    }

    createTimelineLists(parents) {
        const self = this;
        parents.each(function (platform, i) {
            const platformG = d3.select(this);
            const timelineList = platformG.select("g.timelines");
            
            timelineList.selectAll("g.timeline")
                .data(platform => platform.timelines)
                .join(
                    enter => timelineEnter(enter),
                    update => timelineUpdate(update),
                    exit => timelineExit(exit)
                );
        });

        function timelineEnter(timeline) {
            const timelineHeight = self.timelineHeight(1);

            const timelineG = timeline
                .append("g")
                .attr("class", "timeline")
                .attr("transform", (t, i) => self.translate(0, i * timelineHeight));

            // background
            const background = timelineG.append("foreignObject")
                .attr("width", "100%")
                .attr("height", timelineHeight)
                .append("xhtml:div")
                .attr("class", "timeline__background")
                .attr("even", (t, i) => i % 2 === 0 ? "true" : "false");

                // Timeline name (left panel)
            const leftGroup = timelineG.append("g")
                .append("foreignObject")
                .attr("width", self.leftPadding)
                .attr("height", timelineHeight)
                .append("xhtml:div")
                .attr("class", "timeline__label")
                .text(timeline => timeline.name);

            // right panel (draggable-area)
            const itemsArea = timelineG.append("g").attr("class", "items");
        }

        function timelineUpdate(timeline) {
            // update name
            timeline.select("g.timeline .timeline__label").text(timeline => timeline.name);;
        }

        function timelineExit(timeline) {
            timeline.remove()
        }
    }

    createPlatformList(parent) {
        const self = this;
        
        parent.selectAll("g.platform")
            .data(this.dataset.platforms)
            .join(
                enter => enterHandler(enter),
                update => updateHandler(update),
                exit => exit.remove()
            );

        // PLATFORM COMPONENT
        function enterHandler(enter) {
            const platformG = enter.append("g")
                .attr("class", "platform")
                .attr("transform", (p, i) => self.translate(0, 20 * i));

            // placeholder
            platformG.append("foreignObject")
                .attr("width", "100%")
                .attr("height", 27)
                .attr("content", "label")
                .append("xhtml:div")
                .attr("class", "platform__label")
                .text(platform => platform.name);
            
            platformG.append("g")
                .attr("class", "timelines")
                .attr("transform", self.translate(0, 27));
        }

        function updateHandler(update) {
            // change text
            update.select("g.platform div").text(platform => platform.name);
        }

        return parent.selectAll("g.platform");
    }

    // utils
    getTimeScaleDomain() {
        const platforms = this.dataset.platforms;
        let dates = [];
        
        for (let platform of platforms) {
            for (let timeline of platform.timelines) {
                dates = [...dates, ...timeline.milestones.map(m => m.date)];
            
                for (let build of timeline.builds) {
                    dates = [...dates, ...build.milestones.map(m => m.date)];
                }
            }
        }
        
        return [d3.min(dates), d3.max(dates)];
    }
    
    getCurrentX() {
        return this.newX || this.x;
    }

    translate(x, y) {
        return `translate(${x}, ${y})`;
    }

    // render
    render() {
        this.update();
    }
}


const dataset = {
    platforms: [
        {
            name: "Desktop",
            timelines: [
                {
                    id: "timeline#saturn",
                    name: "Saturn POR",
                    builds: [
                        {
                            id: "timeline#saturn#build#poc",
                            name: "PoC",
                            milestones: [
                                { id: "timeline#saturn#build#poc#milestone#mini", title: "SMT/MLB Mini", date: new Date("2018-02-15") },
                                { id: "timeline#saturn#build#poc#milestone#main",title: "SMT/MLB Main", date: new Date("2018-06-20") },
                            ],
                        }
                    ],
                    milestones: [
                        { id: "timeline#saturn#o-milestone#ok2ship", title: "OK2Ship", date: new Date("2018-08-09") },
                        { id: "timeline#saturn#o-milestone#ramp", title: "Ramp", date: new Date("2018-09-01") },
                    ]
                },
                {
                    id: "timeline#mars",
                    name: "Mars",
                    builds: [
                        {
                            id: "timeline#mars#build#pvt",
                            name: "PVT",
                            milestones: [
                                { id: "timeline#mars#build#pvt#milestone#mini", title: "SMT/MLB Mini", date: new Date("2018-01-01") },
                                { id: "timeline#mars#build#pvt#milestone#mini", title: "SMT/MLB Mini", date: new Date("2018-02-12") },
                                { id: "timeline#mars#build#pvt#milestone#main", title: "SMT/MLB Main", date: new Date("2018-02-20") },
                            ],
                        }
                    ],
                    milestones: [
                        { id: "timeline#mars#o-milestone#ok2ship", title: "OK2Ship", date: new Date("2017-05-09") },
                        { id: "timeline#mars#o-milestone#ramp", title: "Ramp", date: new Date("2017-08-10") },
                    ]
                },
                {
                    id: "timeline#earth",
                    name: "Earth",
                    builds: [
                        {
                            id: "timeline#earth#build#dvt",
                            name: "DVT",
                            milestones: [
                                { id: "timeline#earth#build#dvt#milestone#mini", title: "SMT/MLB Mini", date: new Date("2018-01-01") },
                                { id: "timeline#earth#build#dvt#milestone#main", title: "SMT/MLB Main", date: new Date("2018-02-20") },
                            ],
                        }
                    ],
                    milestones: [
                        { id: "timeline#mars#o-milestone#callback", title: "Callback", date: new Date("2019-09-25") },
                        { id: "timeline#mars#o-milestone#ramp", title: "Ramp", date: new Date("2019-07-12") },
                    ]
                },
            ]
        },
    ]
};
  
const c = new Calendar("svg.calendar", dataset);
c.render();
