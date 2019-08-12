const dataset = [
  { type: "milestone", title: "QTT", at: new Date("2018-04-15") },
  { type: "milestone", title: "TTQ", at: new Date("2018-05-10") },
  { type: "build", title: "PoQ", from: new Date(["2018-01-12"]), to: new Date("2018-01-29") },
  { type: "milestone", title: "TTQ", at: new Date("2018-01-10") },
  { type: "milestone", title: "TTQ", at: new Date("2019-01-11") },
  { type: "build", title: "Proton", from: new Date("2018-07-22"), to: new Date("2018-07-29") },
  { type: "milestone", title: "TTQ", at: new Date("2018-08-03") },
  { type: "build", title: "Proton", from: new Date("2018-09-22"), to: new Date("2019-01-15") },
];

let timeline = d3.select("svg");
const timelineHeight = 210;
const timelineWidth = timeline.style("width").split("px")[0];

let x = d3.scaleTime()
  .domain([d3.min(dataset, getMinDate), d3.max(dataset, getMaxDate)])
  .rangeRound([0, timelineWidth]);

const xAxis = d3.axisTop(x).tickSize(-timelineHeight);

const gX = timeline.append("g")
  .attr("class", "x-axis")
  .call(xAxis)
  .attr('transform', `translate(0,20)`)
  .attr('text-anchor', 'start');

  const zoom = d3.zoom().on("zoom", zoomed);
// const zoom = d3.zoom()
//     .scaleExtent([1, 40])
//     .translateExtent([[-100, -100], [timelineWidth + 90, timelineHeight + 100]])
//     .on("zoom", zoomed);

function update(dataset) {
  const milestones = createMilestoneGroup(timeline);
  const builds = createBuildGroup(timeline);
}

function createMilestoneGroup(timeline) {
  return timeline.selectAll("g.milestone")
    .data(dataset.filter(item => item.type === "milestone"))
    .enter()
    .append("g")
    .attr("class", "milestone")
    .attr("transform", m => translate(x(m.at), 100))
    .each(appendMilestone)
    .call(x);
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

function appendMilestone(m, i) {
  const group = d3.select(this);

  // text
  group.append("foreignObject")
    .attr("x", -19).attr("y", -32)
    .append("xhtml:div")
    .attr("class", "milestone-label")
    .html(`
        <div class="title">${m.title}</div>
        ${m.at.toLocaleDateString()}
    `);

  group.append("rect").attr("class", "milestone-diamond");
}

function zoomed() {
  gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
  
  const newX = d3.event.transform.rescaleX(x);
  
  // set new positions and width
  d3.selectAll("g.milestone").attr('transform', m => translate(newX(m.at), 100));
  d3.selectAll("build")
    .attr('x', b => newX(b.from))
    .attr('width', b => newX(b.to) - newX(b.from));


}

timeline.call(zoom);

// utils
function getMaxDate(item) {
  return item.type === "milestone" ? item.at : item.to;
}

function getMinDate(item) {
  return item.type === "milestone" ? item.at : item.from;
}

function translate(x, y) {
  return `translate(${x}, ${y})`;
}

// main
update(dataset);
