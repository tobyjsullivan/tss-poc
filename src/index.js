import React from "react";
import * as ReactDOM from "react-dom/client";
import List from "./List";
import Page from "./Page";

/*
Page List {
  numbered: true
}
*/
// TODO: Merge with a default tree
/**
 * @typedef {Record<string, any>} Declarations
 * @typedef {string | React.JSXElementConstructor<any> | React.JSXElementConstructor<any>} ComponentType
 * @typedef {{type: "simple", component?: ComponentType}} SimpleSelector
 * @typedef {{type: "descendant", path: Selector[]}} DescendantSelector
 * @typedef {SimpleSelector | DescendantSelector} Selector
 * @typedef {{selectors: Selector[], declarations: Declarations}} TssRule
 * @typedef {TssRule[]} TssDocument
 * @type {TssDocument}
 */
const tssDocument = [
  {
    selectors: [
      {
        type: "descendant",
        path: [
          { type: "simple", component: Page },
          { type: "simple", component: List },
        ],
      },
    ],
    declarations: {
      numbered: true,
    },
  },
];

/**
 * @typedef {{element: React.ReactNode, type: ComponentType, ancestors: AncestryTreeNode[], children: AncestryTreeNode[], declarations: Declarations}} AncestryTreeNode
 * @param {React.ReactNode} element
 * @param {AncestryTreeNode[]} ancestors
 * @returns {AncestryTreeNode}
 */
function buildAncestryTree(element, ancestors = []) {
  const children = React.Children.toArray(element.children) //
    .map((child) => buildAncestryTree(child, [...ancestors, element]));

  const result = {
    element,
    type: element.type,
    ancestors,
    children,
    declarations: {},
  };

  console.info(`[buildAncestryTree] element:`, element, `result:`, result);

  return result;
}

/**
 * @param {AncestryTreeNode} ancestryNode
 * @returns {AncestryTreeNode | null}
 */
function getAncestryParent({ ancestors }) {
  if (!ancestors.length === 0) {
    return null;
  }

  return ancestors[ancestors.length - 1];
}

function testDescendantSelector(ancestryNode, selector) {
  const { path } = selector;

  // 1. Check if this node matches the last in the path
  const [currentSelector, ...ancestorPath] = path.reverse();

  if (!testSelector(ancestryNode, currentSelector)) {
    return false;
  }

  if (ancestorPath.length === 0) {
    return true;
  }

  // 2. Check if there are any ancestors which satisfy the remaining criteria
  let nextSelector = ancestorPath.pop();
  for (
    let nextAncestor = getAncestryParent(ancestryNode);
    nextAncestor !== null;
    nextAncestor = getAncestryParent(nextAncestor)
  ) {
    if (testSelector(nextAncestor, nextSelector)) {
      if (ancestorPath.length === 0) {
        // The full path has been satisfied
        return true;
      }
      nextSelector = ancestorPath.pop();
    }
  }

  // Some segmet of the path could not be satisfied.
  return false;
}

/**
 *
 * @param {AncestryTreeNode} ancestryNode
 * @param {Selector} selector
 */
function testSelector(ancestryNode, selector) {
  switch (selector.type) {
    case "simple": {
      const { component } = selector;
      if (!component) {
        // TODO: Support selector other than component type
        throw new Error(`Simple selectors must specify a component.`);
      }

      return ancestryNode.type === component;
    }
    case "descendant": {
      return testDescendantSelector(ancestryNode, selector);
    }
    default:
      throw new Error(`Unknown selector.type: ${selector.type}`);
  }
}

/**
 * Gets the computed styles for the given react node
 *
 * @param {AncestryTreeNode} ancestryNode
 * @param {TssRule} tssRule
 */
function testRule(ancestryNode, tssRule) {
  const result = tssRule.selectors //
    .some((selector) => testSelector(ancestryNode, selector));

  console.info(
    `[testRule] ancestryNode:`,
    ancestryNode,
    ` rule:`,
    tssRule,
    `result:`,
    result
  );

  return result;
}

/**
 *
 * @param {TssDocument} rules
 * @param {AncestryTreeNode} ancestryNode
 * @param {Declarations} accruedDeclarations
 */
function applyRules(rules, ancestryNode, accruedDeclarations) {
  let declarations = { ...accruedDeclarations };
  for (const tssRule of rules) {
    if (testRule(ancestryNode, tssRule)) {
      declarations = Object.assign(declarations, tssRule.declarations);
    }
  }

  ancestryNode.declarations = declarations;

  for (const child of ancestryNode.children) {
    // TODO: Only certain declarations should be passed down. This requires some mechanism to indicate behaviours.
    applyRules(rules, child, declarations);
  }
}

/**
 * @param {AncestryTreeNode} ancestryNode
 */
function buildReactElement(ancestryNode) {
  const children = ancestryNode.children.map((child) =>
    buildReactElement(child)
  );

  const { element: originalElement, declarations } = ancestryNode;
  if (Object.keys(declarations).length === 0) {
    // No mapped declarations
    return originalElement;
  }

  return React.cloneElement(
    originalElement,
    { tssStyles: declarations },
    children
  );
}

/**
 *
 * @param {React.ReactNode} rootElement
 * @returns {React.ReactNode}
 */
function applyTss(rootElement) {
  const ancestryTree = buildAncestryTree(rootElement);

  // Walk the tree and test rules on each node. Apply styles from matching rules.
  applyRules(tssDocument, ancestryTree, {});

  // Build a new react element tree
  return buildReactElement(ancestryTree);
}

// TODO: Apply styles on every rerender
const renderWithTss = (rootElement) => root.render(applyTss(rootElement));

const $root = document.getElementById("root");
if (!$root) {
  throw new Error(`Failed to find $root`);
}

const root = ReactDOM.createRoot($root);

// BROKEN: No rules are applied because no children are passed in.
renderWithTss(React.createElement(Page, null, null));
