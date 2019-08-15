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

// Stack abstraction
let piles = 1;
// const pile = d3.local();
const pileHeight = 55;

// config
const leftPadding = 250;
const timelineHeight = 152 + (( piles - 1 ) * pileHeight);
const timelineBaseline = 50;

const buildMilestoneRadius = 3;
const buildMilestoneMinY = timelineBaseline + 45;

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

function update(dataset) {
  const platforms = createPlatforms(dataset.platforms);
  //const milestones = createMilestoneGroup(calendar);
  //const builds = createBuildGroup(calendar);
}

function createPlatforms(platforms) {
  // add
  calendar.select("g.platform-list")
    .selectAll("g.platform")
    .data(platforms)
    .enter()
    .each(PlatformComponent);

  // remove
  calendar.select("g.platform-list")
    .selectAll("g.platform")
    .data(platforms)
    .exit()
    .remove();
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
    .attr("transform", translate(0, 20));

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
    .attr("transform", translate(0, 27))
    .selectAll("g.timeline")
    .data(platform => platform.timelines)
    .enter()
    .each(TimelineComponent);
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

  // Milestones (right panel)
  const milestonesArea = itemsArea.append("g")
    .attr("class", "milestones")
    .attr("width", calendarWidth - leftPadding)
    .attr("transform", translate(leftPadding, 0));

  // outside milestones
  milestonesArea.selectAll("g.milestone")
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

  milestonesArea.selectAll("g.build__milestone")
    .data(timeline => {
      let milestones = [];
      for (let build of timeline.builds) {
        milestones = milestones.concat(build.milestones);
      }
      return milestones;
    })
    .enter()
    .each(BuildMilestoneComponent);

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
}

function BuildComponent(build, i) {
  const xScale = newX || x;

  const minDate = d3.min(build.milestones,  m => m.date);
  const maxDate = d3.max(build.milestones,  m => m.date);

  const positions = { 
    x: xScale(minDate) - leftPadding - buildMilestoneRadius, 
    y: timelineBaseline - 15
  };

  const width = xScale(maxDate) - xScale(minDate) + (buildMilestoneRadius * 2); // dont touch

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
}

function BuildMilestoneComponent(milestone, i) {
  const xScale = newX || x;

  const positions = { 
    x: xScale(milestone.date) - leftPadding, 
    y: buildMilestoneMinY
  };

  const group = d3.select(this)
    .append("g").attr("class", "build__milestone")
    .attr("transform", translate(positions.x, positions.y))
    .attr("data-id", milestone.id);

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
    .attr("r", buildMilestoneRadius);

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

    group.attr("transform", translate(mouseX - leftPadding, timelineHeight /2));
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

  let myPile = 0;

  const positions = { 
    x: xScale(milestone.date) - leftPadding, 
    y: timelineBaseline + (myPile * pileHeight)
  };

  const group = d3.select(this)
    .append("g").attr("class", "milestone")
    .attr("data-id", milestone.id)
    .attr("data-pile", myPile)
    .attr("transform", translate(positions.x, positions.y))
    .attr("data-x", positions.x)
    .attr("data-y", positions.x);

  // text
  let textY = -32;
  const text = group.append("foreignObject")
    .attr("width", 100)
    .attr("height", 50)
    .attr("x", -19);
  
  text.append("xhtml:div")
    .attr("class", "milestone-label")
    .html(`
        <div class="title">${milestone.title}</div>
        ${milestone.date.toLocaleDateString()}
    `);

  // diamond
  const diamond = group.append("rect").attr("class", "milestone-diamond");

  //collision resolution

  while (isSomeoneTouchingMyText(myPile, positions.x)) {
    myPile += 1;
    if (myPile > (piles - 1)) {
      piles++;
    } else {
      piles--;
    }
  }

  group.attr("data-pile", myPile)
  text.attr("y", textY + ( (myPile * pileHeight)));

  function isSomeoneTouchingMyText(pile, myX) {    
    const xScale = newX || x;

    const otherMilestones = d3.selectAll(`g.milestone[data-pile='${pile}']`).nodes();

    for (let i = 0; i < otherMilestones.length; i++) {
      const other = d3.select(otherMilestones[i]);

      // if is the same element
      if (myX === Number(other.attr("data-x"))) {
        continue;
      }

      if ( +(myX - Number(other.attr("data-x"))) <= 100) {
        return true;
      }
    }

    return false;
  }


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

    group.attr("transform", translate(mouseX - leftPadding, timelineBaseline));
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
  d3.selectAll("g.milestone").attr('transform', m => translate(newX(m.date) - leftPadding, timelineBaseline));

  d3.selectAll("g.build__milestone").attr('transform', m => translate(newX(m.date) - leftPadding, buildMilestoneMinY));

  d3.selectAll("g.build").each(function(build) {
    const minDate = d3.min(build.milestones,  m => m.date);
    const maxDate = d3.max(build.milestones,  m => m.date);
  
    const positions = { 
      x: newX(minDate) - leftPadding -  buildMilestoneRadius, 
      y: timelineBaseline - 15
    };
  
    const width = newX(maxDate) - newX(minDate) + (2 * buildMilestoneRadius);

    d3.select(this).attr("transform", translate(positions.x, positions.y));
    d3.select(this).select("foreignObject").attr("width", width);
  })
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
update(dataset);

function clean() {
  update({ platforms: [] });
}

function addMilestone(timelineIndex, milestone) {
  dataset.platforms[0].timelines[timelineIndex].milestones.push(milestone);
  redraw();
}

function redraw() {
  clean();
  update(dataset);
}