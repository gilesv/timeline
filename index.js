// const dataset = [
//   { type: "milestone", title: "QTT", at: new Date("2018-04-15") },
//   { type: "milestone", title: "TTQ", at: new Date("2018-05-10") },
//   { type: "build", title: "PoQ", from: new Date(["2018-01-12"]), to: new Date("2018-01-29") },
//   { type: "milestone", title: "TTQ", at: new Date("2018-01-10") },
//   { type: "milestone", title: "TTQ", at: new Date("2019-01-11") },
//   { type: "build", title: "Proton", from: new Date("2018-07-22"), to: new Date("2018-07-29") },
//   { type: "milestone", title: "TTQ", at: new Date("2018-08-03") },
//   { type: "build", title: "Proton", from: new Date("2018-09-22"), to: new Date("2019-01-15") },
// ];

let dataset = {
  platforms: [
    {
      id: "platform#desktop",
      name: "Desktop",
      timelines: [
        {
          id: "timeline#saturn",
          name: "Saturn POR",
          builds: [
            {
              name: "PoC",
              milestones: [
                { title: "SMT/MLB Mini", date: new Date("2018-02-15") },
                { title: "SMT/MLB Main", date: new Date("2018-06-20") },
              ],
            }
          ],
          milestones: [
            { title: "OK2Ship", date: new Date("2018-08-09") },
            { title: "Ramp", date: new Date("2018-12-10") },
          ]
        },
        {
          id: "timeline#mars",
          name: "Mars",
          builds: [
            {
              name: "PVT",
              milestones: [
                { title: "SMT/MLB Mini", date: new Date("2018-01-01") },
                { title: "SMT/MLB Main", date: new Date("2018-02-20") },
              ],
            }
          ],
          milestones: [
            { title: "OK2Ship", date: new Date("2017-05-09") },
            { title: "Ramp", date: new Date("2017-08-10") },
          ]
        },
        {
          id: "timeline#earth",
          name: "Earth",
          builds: [
            {
              name: "DTV",
              milestones: [
                { title: "SMT/MLB Mini", date: new Date("2018-01-01") },
                { title: "SMT/MLB Main", date: new Date("2018-02-20") },
              ],
            }
          ],
          milestones: [
            { title: "Callback", date: new Date("2019-09-25") },
            { title: "Ramp", date: new Date("2019-07-12") },
          ]
        },
      ]
    }
  ]
};

let x;
let xAxis;
let gx;
let calendar;
let calWidth;
let calHeight;
let zoom;
let newX;

// config
const leftPadding = 250;
const timelineHeight = 100;

function setUp() {
  calendar = d3.select("svg.calendar");
  calendarHeight = calendar.style("height").split("px")[0];
  calendarWidth = calendar.style("width").split("px")[0];

  x = d3.scaleTime()
    .domain(getDomain(dataset))
    .range([leftPadding, calendarWidth]);

  xAxis = d3.axisTop(x).tickSize(-(calendarHeight - 20));

  gX = calendar.append("g")
    .attr("class", "x-axis")
    .attr("height", calendarHeight)
    .call(xAxis)
    .attr('transform', translate(0, 20))
    .attr('text-anchor', 'start');

  // Platform list
  calendar.append("g")
    .attr("class", "platform-list");

  zoom = d3.zoom(x).on("zoom", zoomed);
  // const zoom = d3.zoom()
  //   .scaleExtent([1, 40])
  //   .translateExtent([[-100, -100], [calendarWidth + 90, calendarHeight + 100]])
  //   .on("zoom", zoomed);

  calendar.call(zoom);
}

function update() {
  const platforms = calendar.select("g.platform-list")
    .selectAll("g.platform")
    .data(dataset.platforms, p => p.id)
    .join(
      enter => enter.each(PlatformComponent),
      update => update.attr("fill", "blue"),
      exit => exit.remove()
    );

  const timelines = platforms.select("g.timeline-list")
    .selectAll("g.timeline")
    .data(platform => platform.timelines)
    .join(enter => enter.each(TimelineComponent));
}

/**
 * Platform component
 * 
 * @param {Platform} platform 
 * @param {number} i 
 */
function PlatformComponent(platform, i) {
  const platformName = platform.name;

  const group = d3.select(this)
    .append("g").attr("class", "platform")
    .attr("transform", translate(0, 20))
    .attr("data-name", platform.name);

  // Label
  group.append("foreignObject")
    .attr("width", "100%")
    .attr("height", 27)
    .attr("content", "label")
    .append("xhtml:div")
    .attr("class", "platform__label")
    .text(platformName);

  // Timelines
  group.append("g")
    .attr("class", "timeline-list")

  return group;
  // .attr("transform", translate(0, 27))
  // .selectAll("g.timeline")
  // .data(platform => platform.timelines)
  // .join(enter => enter.each(TimelineComponent));
}

function TimelineComponent(timeline, i) {
  const group = d3.select(this)
    .append("g")
    .attr("class", "timeline")
    .attr("transform", translate(0, i * timelineHeight));

  group.append("foreignObject")
    .attr("width", "100%")
    .attr("height", timelineHeight)
    .append("xhtml:div")
    .attr("class", "timeline__background")
    .attr("even", i % 2 === 0 ? "true" : "false");

  // right panel (draggable-area)
  const itemsArea = group.append("g").attr("class", "items");

  // Outside Milestones (right panel)
  itemsArea.append("g").attr("class", "outside-milestones")
    .attr("width", calendarWidth - leftPadding)
    .attr("transform", translate(leftPadding, 0))
    .selectAll("g.milestone")
    .data(timeline => timeline.milestones)
    .enter()
    .each(OutsideMilestoneComponent);

  // Builds (with bandings)
  itemsArea.append("g").attr("class", "builds")
    .attr("width", calendarWidth - leftPadding)
    .attr("transform", translate(leftPadding, 0))
    .selectAll("g.build")
    .data(timeline => timeline.builds)
    .enter()
    .each(BuildComponent);

  // guideline
  const guide = group.append("line")
    .attr("y1", 0)
    .attr("y2", timelineHeight)
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("height", timelineHeight)
    .attr("stroke", "#98989840")
    .attr("stroke-width", 1);

  // Timeline name (left panel)
  const leftGroup = group.append("g")
    .append("foreignObject")
    .attr("width", leftPadding)
    .attr("height", timelineHeight)
    .append("xhtml:div")
    .attr("class", "timeline__label")
    .text(timeline.name);

  // Insert new Milestone
  group.on("click", function () {
    const [mouseX, mouseY] = d3.mouse(d3.event.target);

    if (mouseX < leftPadding) {
      return;
    }

    const xScale = newX || x;
    const date = xScale.invert(mouseX);
    const milestone = { title: "Adobe flash", date }

    addMilestone(i, milestone);
  });

  // Display line guide
  group.on("mousemove", function () {
    const mouseX = d3.mouse(d3.event.target)[0];

    if (mouseX < leftPadding) {
      guide.attr("x1", 0).attr("x2", 0);
    } else {
      guide.attr("x1", mouseX).attr("x2", mouseX);
    }
  });

  group.on("mouseleave", function () {
    guide.attr("x1", 0).attr("x2", 0);
  })

  // drag n drop
  function dragStarted(timeline) {
    group.raise();
    calendar.attr("cursor", "grabbing");

    draggedTimelineY = d3.event.y;
    freeTimelineSlot = slots[timeline.id];
  }

  function dragging(timeline) {
    const mouseY = d3.event.y;

    if (mouseY < 0) {
      group.attr("transform", translate(0, 0));
      return;
    }

    if (mouseY > (calHeight - timelineHeight)) {
      group.attr("transform", translate(0, calHeight - timelineHeight));
      return;
    }

    group.attr("transform", translate(0, mouseY));
  }

  function dragEnd() {
    calendar.attr("cursor", "normal");
    // redraw();
  }

  leftGroup.call(d3.drag()
    .container(d3.select("g.timeline-list").node())
    .on("start", dragStarted)
    .on("drag", dragging)
    .on("end", dragEnd)
  );

  return group;
}

function BuildComponent(build, i) {
  const xScale = newX || x;

  const minDate = d3.min(build.milestones, m => m.date);
  const maxDate = d3.max(build.milestones, m => m.date);

  const positions = {
    x: xScale(minDate) - leftPadding,
    y: (timelineHeight / 2) - 15
  };

  const width = xScale(maxDate) - xScale(minDate);

  const group = d3.select(this)
    .append("g").attr("class", "build")
    .attr("transform", translate(positions.x, positions.y))
    .attr("width", width);

  // Label & banding
  const header = group.append("foreignObject")
    .attr("width", width)
    .attr("height", 27)
    .attr("content", "build-header")
    .append("xhtml:div")
    .attr("class", "build__header")
    .html(`
      <div class="build__name">${build.name}</div>
      <div class="build__banding"></div>
    `);

  const body = group.append("g").attr("class", "build__milestones")
    .selectAll("g.milestone")
    .data(build => build.milestones)
    .enter()
    .each(BuildMilestoneComponent);
}

function BuildMilestoneComponent(milestone, i) {
  const xScale = newX || x;

  const positions = {
    x: xScale(milestone.date) - leftPadding,
    y: timelineHeight / 2
  };

  const group = d3.select(this)
    .append("g").attr("class", "build__milestone")
    .attr("transform", translate(positions.x, positions.y));

  // text
  group.append("foreignObject")
    .attr("width", 100)
    .attr("height", 50)
    .attr("x", -4).attr("y", -27)
    .append("xhtml:div")
    .attr("class", "build__milestone-label")
    .html(`
        <div class="build__milestone-label-title">${milestone.title}</div>
        ${milestone.date.toLocaleDateString()}
    `);

  // diamond
  const diamond = group.append("circle")
    .attr("class", "build__milestone-diamond")
    .attr("r", 4);

  // move milestone
  function dragStarted() {
    group.raise();
    group.attr("cursor", "grabbing");
  }

  function dragging(milestone) {
    const mouseX = d3.event.x;
    const getDateFromX = (mouseX) => {
      const xScale = newX || x;
      return xScale.invert(mouseX)
    }

    milestone.date = getDateFromX(mouseX);

    group.attr("transform", translate(mouseX - leftPadding, timelineHeight / 2));
  }

  function dragEnd() {
    group.attr("cursor", "grab");
    redraw();
  }

  diamond.call(d3.drag()
    .container(d3.select("g.timeline").node())
    .on("start", dragStarted)
    .on("drag", dragging)
    .on("end", dragEnd)
  );

  // place
  group.call(x);
}

let timelineListOrder = dataset.platforms[0].timelines.map(t => t.id);

let draggedTimelineY;
let freeTimelineSlot;

let slots = ((timelines) => {
  return timelines.reduce((result, timeline, i) => {
    result[timeline.id] = i;
    return result;
  }, {});
})(dataset.platforms[0].timelines);

function OutsideMilestoneComponent(milestone, i) {
  const xScale = newX || x;

  const positions = {
    x: xScale(milestone.date) - leftPadding,
    y: timelineHeight / 2
  };

  const group = d3.select(this)
    .append("g").attr("class", "milestone")
    .attr("transform", translate(positions.x, positions.y));

  // text
  group.append("foreignObject")
    .attr("width", 100)
    .attr("height", 50)
    .attr("x", -19).attr("y", -32)
    .append("xhtml:div")
    .attr("class", "milestone-label")
    .html(`
        <div class="title">${milestone.title}</div>
        ${milestone.date.toLocaleDateString()}
    `);

  // diamond
  const diamond = group.append("rect").attr("class", "milestone-diamond");

  //collision resolution

  // while (isSomeoneTouchingMe(milestone)) {
  //   positions.y += 40;
  //   group.attr("transform", translate(positions.x, positions.y));
  // }

  // function isSomeoneTouchingMe(me) {
  //   const otherMilestones = d3.selectAll("g.milestone");
  //   const xScale = newX || x;

  //   for (let i = 0; i < otherMilestones.size(); i++) {
  //     if (me === otherMilestones[i].datum()) {
  //       continue;
  //     }

  //     if ( +(xScale(me.date) - xScale(other.date)) <= 10) {
  //       return true;
  //     }
  //   }

  //   return false;
  // }


  // move milestone
  function dragStarted() {
    group.raise();
    group.attr("cursor", "grabbing");
  }

  function dragging(milestone) {
    const mouseX = d3.event.x;
    const getDateFromX = (mouseX) => {
      const xScale = newX || x;
      return xScale.invert(mouseX)
    }

    milestone.date = getDateFromX(mouseX);

    group.attr("transform", translate(mouseX - leftPadding, timelineHeight / 2));
  }

  function dragEnd() {
    group.attr("cursor", "grab");
    redraw();
  }

  diamond.call(d3.drag()
    .container(d3.select("g.timeline").node())
    .on("start", dragStarted)
    .on("drag", dragging)
    .on("end", dragEnd)
  );

  // place
  group.call(x);
}

function createBuildGroup(timeline) {
  return timeline.selectAll("rect")
    .data(dataset.filter(item => item.type === "build"))
    .enter()
    .append("rect").attr("class", "item build")
    .attr("x", b => x(b.from))
    .attr("y", 40)
    .attr("width", b => x(b.to) - x(b.from))
    .attr("height", 10);
}

function zoomed() {
  gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));

  newX = d3.event.transform.rescaleX(x);

  // set new positions and width
  d3.selectAll("g.milestone").attr('transform', m => translate(newX(m.date) - leftPadding, timelineHeight / 2));
  // d3.selectAll("build")
  //   .attr('x', b => newX(b.from))
  //   .attr('width', b => newX(b.to) - newX(b.from));


}


// utils

/**
 * Gets the min and max dates to plot in the calendar
 * @param {Object} dataset 
 */
function getDomain(dataset) {
  const platforms = dataset.platforms;
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

function translate(x, y) {
  return `translate(${x}, ${y})`;
}

// main
setUp();
update();

function clean() {
  update({ platforms: [] });
}

function addMilestone(timelineIndex, milestone) {
  dataset.platforms[0].timelines[timelineIndex].milestones.push(milestone);
  // redraw();
}

function redraw() {
  clean();
  update(dataset);
}