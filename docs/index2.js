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
        this.ySections = 1;
        this.ySectionHeight = 55;

        // config
        this.leftPadding = 250;
        this.timelineBaseline = 50;

        this.buildMilestoneRadius = 3;
        this.buildMilestoneMinY = this.timelineBaseline + 45;

        // init setup
        this.setupUiState();
        this.setup();
    }

    setupUiState() {
        const timelines = this.dataset.platforms[0].timelines;

        // timelines
        const timelineUiState = timelines.reduce((result, timeline) => { 
            result[timeline.id] = {
                ySections: 1,
                height: this.timelineHeight(1)
            };
            return result;
        }, {});

        this.uiState = {
            timelines: timelineUiState,
        }
    }

    timelineHeight(ySectionsNumber) {
        return ((ySectionsNumber - 1) * this.ySectionHeight) + 120;
    }

    setup() {
        this.calendar = d3.select(this.selector);
        this.calendarHeight = this.calendar.style("height").split("px")[0];
        this.calendarWidth = this.calendar.style("width").split("px")[0];

        this.configTimeScale();
        this.configCalendarZoom();

        this.platformList = this.calendar.append("g")
            .attr("transform", this.translate(0, 20))
            .attr("class", "platforms");
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
        const self = this;

        // Rescale the time scale
        this.newX = d3.event.transform.rescaleX(this.x);
        this.gX.call(this.xAxis.scale(this.newX));

        // outside milestones
        // d3.selectAll("g.milestone").attr('transform', m => {
        //     return this.translate(this.newX(m.date) - this.leftPadding, this.timelineBaseline)
        // });


        // Builds
        d3.selectAll("g.build").each(function (buildData) {
            const config = self.getBuildConfig(buildData)

            d3.select(this).attr("transform", self.translate(config.x, config.y));
            d3.select(this).select("foreignObject").attr("width", config.width);
        });

        // Milestones
        d3.selectAll("g.build__milestone")
            // .sort(this.compareMilestoneDate)
            .each(function (milestoneData, i, nodes) {
                const config = self.getMilestoneConfig(milestoneData, nodes[i]);
                const oldY = self.buildMilestoneMinY + (Number(d3.select(this).attr('data-ysection')) - 1) * self.ySectionHeight;

                d3.select(this)
                    .attr("data-ysection", config.ySection)
                    // .attr("transform", self.translate(config.x, oldY))
                    .transition()
                    .duration(150)
                    // .ease(d3.easeLinear)
                    .attrTween('transform', function() {
                        return d3.interpolateTransformSvg(self.translate(config.x, oldY), self.translate(config.x, config.y))
                    })
                    // .attr("transform", self.translate(config.x, config.y));
            });

    }

    update() {
        const platforms = this.createPlatformList(this.platformList);
        const timelines = this.createTimelineLists(platforms);
        const builds = this.createBuilds(timelines);
        const milestones = this.createMilestones(timelines);
    }

    createMilestones(parents) {
        const self = this;

        const transition = d3.transition()
            .duration(500)
            .ease(d3.easeCubicInOut);

        parents.each(function (timeline, i) {
            const timelineG = d3.select(this);
            const items = timelineG.select("g.items");

            items.selectAll("g.build__milestone")
                .data(timeline => self.getAllMilestones(timeline), m => m.id)
                .join(
                    enter => enter.size() ? enterMilestone(enter, timeline) : () => { },
                    update => update.size() ? updateMilestone(update, timeline) : () => { }
                );
        });

        function enterMilestone(selection, timeline) {
            selection
                // .sort(self.compareMilestoneDate)
                .each((milestoneData, i, nodes) => {
                    const config = self.getMilestoneConfig(milestoneData, nodes[i], timeline.id);

                    const milestoneG = d3.select(nodes[i])
                        .append("g")
                        .attr("class", "build__milestone")
                        .attr("transform", self.translate(config.x, config.y))
                        .attr("data-id", milestoneData.id)
                        .attr("data-timeline", timeline.id)
                        .attr("data-x", config.x)
                        .attr("data-ysection", config.ySection);

                    // Label & banding
                    milestoneG.append("foreignObject")
                        .attr("width", 100)
                        .attr("height", 50)
                        .attr("x", -4).attr("y", -27)
                        .append("xhtml:div")
                        .attr("class", "build__milestone-label")
                        .html(`
                            <div class="build__milestone-label-title">
                                ${milestoneData.title}
                            </div>
                            <div class="build__milestone-label-date">
                                ${milestoneData.date.toLocaleDateString()}
                            </div>
                        `);

                    // diamond
                    const diamond = milestoneG.append("circle")
                        .attr("class", "build__milestone-diamond")
                        .attr("r", self.buildMilestoneRadius);

                    diamond.call(d3.drag()
                        .container(d3.select("g.timeline").node())
                        .on("start", dragStarted)
                        .on("drag", dragging)
                        .on("end", dragEnd)
                    );
                })

        }

        function updateMilestone(selection) {
            selection
                // .sort(self.compareMilestoneDate)
                .each((milestoneData, i, nodes) => {
                    // change text
                    const milestoneSelection = d3.select(nodes[i]);

                    // change build name
                    milestoneSelection.select("foreignObject div.build__milestone-label-title")
                        .text(milestoneData.title);

                    // change build date
                    milestoneSelection.select("foreignObject div.build__milestone-label-date")
                        .text(milestoneData.date.toLocaleDateString());

                    // update config
                    const config = self.getMilestoneConfig(milestoneData, nodes[i]);
                    milestoneSelection
                        .attr("transform", self.translate(config.x, config.y))
                        .attr("data-ysection", config.ySection);
                })
        }

        // DRAG MILESTONE
        function dragStarted(milestoneData, i) {
            const milestoneG = d3.select(this.parentNode);
            milestoneG.raise();
            d3.select(this).attr("cursor", "grabbing");
        }

        function dragging(milestoneData, i) {
            const mouseX = d3.event.x;
            const x = self.getCurrentX();

            milestoneData.date = x.invert(mouseX);

            self.update();
        }

        function dragEnd() {
            d3.select(this).attr("cursor", "grab");
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

        return parents.selectAll("g.timeline");
    }

    createBuilds(parents) {
        const self = this;

        const transition = d3.transition()
            .duration(500)
            .ease(d3.easeCubicInOut);

        parents.each(function (timeline, i) {
            const timelineG = d3.select(this);
            const items = timelineG.select("g.items");

            items.selectAll("g.build")
                .data(timeline => timeline.builds)
                .join(
                    enter => enter.size() ? enterBuild(enter) : () => { },
                    update => update.size() ? updateBuild(update) : () => { }
                );
        });

        function enterBuild(buildsSelection) {
            buildsSelection.each((buildData, i, buildNodes) => {
                const config = self.getBuildConfig(buildData);
                const buildG = d3.select(buildNodes[i]).append("g").attr("class", "build")
                    .attr("transform", self.translate(config.x, config.y))
                    .attr("width", config.width)
                    .attr("expanded", false)
                    .attr("data-x", config.x);

                // Label & banding
                const foreign = buildG.append("foreignObject")
                    .attr("width", config.width)
                    .attr("height", 30)
                    .append("xhtml:div")
                    .attr("class", "build__header")
                    .html(`
                        <div class="build__title">
                            <div class="build__arrow"></div>
                            <span class="build__name">${buildData.name}</span>
                        </div>
                        <div class="build__banding"></div>
                    `);

                // expand/collapse handler
                buildG.select("div.build__arrow")
                    .on("click", function () {
                        const buildG = d3.select(this.parentNode.parentNode.parentNode.parentNode);
                        const milestones = buildData.milestones.map(m => m.id);
                        let expanded = buildG.attr("expanded") === "true";

                        buildG.attr("expanded", !expanded);

                        // hide milestones
                        milestones.forEach(m => {
                            d3.select(`g.build__milestone[data-id='${m}']`)
                                .classed("visible", !expanded);
                        })

                    });

                buildG.select("span.build__name")
                    .call(d3.drag()
                        .container(d3.select("g.timeline").node())
                        .on("start", dragStarted)
                        .on("drag", dragging)
                        .on("end", dragEnd)
                    )
            });

        }

        function updateBuild(buildsSelection) {
            buildsSelection.each((buildData, i, buildNodes) => {
                // change text
                const buildSelection = d3.select(buildNodes[i]);

                buildSelection.select("g.build foreignObject div.build__name span").text(buildData.name);

                // update config
                const config = self.getBuildConfig(buildData);
                buildSelection.attr("transform", self.translate(config.x, config.y));
                buildSelection.attr("data-x", config.x);

                buildSelection.select("foreignObject").attr("width", config.width);
            })
        }

        // DRAG BUILD
        function dragStarted(buildData, i) {
            return function() {
                const buildG = d3.select(this.parentNode.parentNode.parentNode.parentNode);
                buildG.raise();
                d3.select(this).attr("cursor", "grabbing");
            }
        }

        function dragging(buildData, i) {
            const buildG = d3.select(this.parentNode.parentNode.parentNode.parentNode);
            const x = self.getCurrentX();

            const currentBuildX = Number(buildG.attr("data-x"));
            const mouseX = d3.event.x;
            const interval = mouseX - currentBuildX;

            buildData.milestones.forEach(milestone => {
                const currentX = Number(x(milestone.date));
                const newDate = x.invert(currentX + interval);
                milestone.date = newDate;
            });

            self.update();
        }

        function dragEnd() {
            d3.select(this).attr("cursor", "normal");
        }
    }

    getBuildConfig(buildData) {
        const x = this.getCurrentX();

        const minDate = d3.min(buildData.milestones, m => m.date);
        const maxDate = d3.max(buildData.milestones, m => m.date);

        return {
            x: x(minDate) - this.buildMilestoneRadius,
            y: this.timelineBaseline - 15,
            width: x(maxDate) - x(minDate) + (this.buildMilestoneRadius * 2)
        }
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

    getAllMilestones(timeline) {
        let milestones = [];

        for (let build of timeline.builds) {
            milestones = milestones.concat(build.milestones);
        }

        return milestones;
    }

    getMilestoneConfig(milestoneData, node, timelineId = null) {
        const xScale = this.getCurrentX();

        if (timelineId === null) {
            timelineId = d3.select(node).attr("data-timeline");
        }

        let x = Number(xScale(milestoneData.date));
        let y = this.buildMilestoneMinY;
        let ySection = 1;

        while (this.isMilestoneColliding(milestoneData.id, x, timelineId, ySection)) {
            ySection++;
            
            if (ySection > this.uiState.timelines[timelineId].ySections) {
                this.uiState.timelines[timelineId].ySections++;
            }
        }

        y += (ySection - 1) * this.ySectionHeight;

        return {
            x: xScale(milestoneData.date),
            y,
            ySection
        };
    }

    isMilestoneColliding(milestoneId, milestoneX, timelineId, ySection) {
        const xScale = this.getCurrentX();
        const otherMilestonesData = d3.selectAll(`g.build__milestone[data-ysection='${ySection}'][data-timeline='${timelineId}']`).data();

        for (let i = 0; i < otherMilestonesData.length; i++) {
            const otherX = xScale(otherMilestonesData[i].date);
            const otherId = otherMilestonesData[i].id;

            if (milestoneId !== otherId && Math.hypot(milestoneX - otherX, 0) <= 80) {
                return true;
            }
        }

        return false;
    }

    compareMilestoneDate(milestoneA, milestoneB) {
        if (milestoneA.date.getTime() === milestoneB.date.getTime()) {
            return 0;
        }

        return milestoneA.date > milestoneB.date ? 1 : -1;
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
                                { id: "timeline#saturn#build#poc#milestone#main", title: "SMT/MLB Main", date: new Date("2018-06-20") },
                            ],
                        },
                        {
                            id: "timeline#saturn#build#aaa",
                            name: "AaA",
                            milestones: [
                                { id: "timeline#saturn#build#aaa#milestone#mini", title: "SMT/MLB Mini", date: new Date("2018-09-15") },
                                { id: "timeline#saturn#build#aaa#milestone#main", title: "SMT/MLB Main", date: new Date("2019-02-20") },
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
                                { id: "timeline#mars#build#pvt#milestone#minAi", title: "SMT/MLB MiniAA", date: new Date("2018-02-12") },
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
