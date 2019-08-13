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

const dataset = {
  platforms: [
    {
      name: "Desktop",
      timelines: [
        {
          name: "Saturn POR",
          builds: [
            {
              name: "PoC",
              milestones: [
                { title: "SMT/MLB Mini", date: new Date("2018-04-15") },
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
  calendar.append("g")
    .attr("class", "platform-list")
    .selectAll("g.platform")
    .data(platforms)
    .enter()
    .each(PlatformComponent);
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
    .attr("transform", translate(0, i * timelineHeight))

  group.append("foreignObject")
    .attr("width", "100%")
    .attr("height", timelineHeight)
    .append("xhtml:div")
    .attr("class", "timeline__background")
    .attr("even", i % 2 === 0 ? "true" : "false");

  // Timeline name (left panel)
  group.append("foreignObject")
    .attr("width", leftPadding)
    .attr("height", timelineHeight)
    .append("xhtml:div")
    .attr("class", "timeline__label")
    .text(timeline.name);

  // Outside Milestones (right panel)
  group.append("g")
    .attr("width", calendarWidth - leftPadding)
    .attr("transform", translate(leftPadding, 0))
    .selectAll("g.milestone")
    .data(timeline => timeline.milestones)
    .enter()
    .each(OutsideMilestoneComponent);
}

function OutsideMilestoneComponent(milestone, i) {
  const group = d3.select(this)
    .append("g").attr("class", "milestone")
    .attr("transform", m => translate(x(m.date) - leftPadding, timelineHeight / 2));

  // text
  group.append("foreignObject")
    .attr("x", -19).attr("y", -32)
    .append("xhtml:div")
    .attr("class", "milestone-label")
    .html(`
        <div class="title">${milestone.title}</div>
        ${milestone.date.toLocaleDateString()}
    `);

  // diamond
  group.append("rect").attr("class", "milestone-diamond");

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

  const newX = d3.event.transform.rescaleX(x);

  // set new positions and width
  d3.selectAll("g.milestone").attr('transform', m => translate(newX(m.date) - leftPadding, timelineHeight / 2));
  // d3.selectAll("build")
  //   .attr('x', b => newX(b.from))
  //   .attr('width', b => newX(b.to) - newX(b.from));


}


// utils
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
