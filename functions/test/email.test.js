const test = require("node:test");
const assert = require("node:assert");
const { TEMPLATES } = require("../src/email");

test("every email names the seller and links back to AlkeShop", () => {
  const data = { name: "Ama Studio", title: "Shop Kit", kind: "product", id: "product-1", note: "Add a preview" };
  for (const [name, make] of Object.entries(TEMPLATES)) {
    const { subject, html } = make(data);
    assert.ok(subject.length > 5, name);
    assert.match(html, /Hi Ama Studio/, name);
    assert.match(html, /https:\/\/alkeshop\.net\//, name);
  }
  assert.match(TEMPLATES.listingReturned(data).html, /seller\/new-product\?edit=product-1/);
});

test("what sellers typed can't inject HTML", () => {
  const { html } = TEMPLATES.listingReturned({ name: "<b>x</b>", title: "<script>", kind: "service", id: "s", note: "\"><img src=x>" });
  assert.doesNotMatch(html, /<script>|<img|<b>x/);
  assert.match(html, /&lt;script&gt;/);
});
