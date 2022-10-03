import React from "react";

/**
 * @param {{ label: string }} props
 * @returns {React.ReactNode}
 */
export function ListItem({ label }) {
  return React.createElement("li", null, label);
}

/**
 * @param {{ items: { label }[]}} props
 * @returns {React.ReactNode}
 */
function List({ items, style: { numbered = false } = {} }) {
  const componentClass = numbered ? "ol" : "ul";

  return React.createElement(
    componentClass,
    null,
    items.map((item) =>
      React.createElement(
        ListItem,
        { key: item.label, label: item.label },
        null
      )
    )
  );
}

export default List;
