import * as React from "react";
import { MonacoDiffEditorProps } from "./types";
import { noop } from "./utils";
declare function MonacoDiffEditor({ width, height, value, defaultValue, language, theme, options, overrideServices, editorWillMount, editorDidMount, editorWillUnmount, onChange, className, original, originalUri, modifiedUri, }: MonacoDiffEditorProps): React.JSX.Element;
declare namespace MonacoDiffEditor {
    var defaultProps: {
        width: string;
        height: string;
        original: any;
        value: any;
        defaultValue: string;
        language: string;
        theme: any;
        options: {};
        overrideServices: {};
        editorWillMount: typeof noop;
        editorDidMount: typeof noop;
        editorWillUnmount: typeof noop;
        onChange: typeof noop;
        className: any;
    };
    var displayName: string;
}
export default MonacoDiffEditor;
