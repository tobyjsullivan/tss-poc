import React from "react";
import List from "./List";

function Hello() {
  return React.createElement("h1", null, "Hello world!");
}

function Page() {
  const items = [
    { label: "one fish" },
    { label: "two fish" },
    { label: "red fish" },
    { label: "blue fish" },
  ];

  return React.createElement(React.Fragment, null, [
    React.createElement(Hello, { key: "page" }, null),
    React.createElement(List, { key: "list", items }, null),
  ]);
}

export default Page;
