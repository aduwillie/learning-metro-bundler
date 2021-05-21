import * as React from "react";
import * as ReactDom from "react-dom";

const HelloWorld = (): JSX.Element => {
  return <div>Hello, typescript and React!</div>;
};

ReactDom.render(<HelloWorld />, document.getElementById("main"));
