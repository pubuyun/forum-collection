import React from "react";
import { createRoot } from "react-dom/client";
import styled from 'styled-components';
import MonacoEditor from "react-monaco-editor";
import { createGlobalStyle } from 'styled-components';
import OneDarkPro from "monaco-themes/themes/OneDark-Pro.json";
import GithubLight from "monaco-themes/themes/GitHub Light.json";


// 定义全局样式
const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${({ theme }) => (theme === 'one-dark-pro' ? '#222222' : '#fbfbfb')};
    color: ${({ theme }) => (theme === 'one-dark-pro' ? '#ffffff' : '#000000')};
  }
  div {
    background-color: ${({ theme }) => (theme === 'one-dark-pro' ? '#222222' : '#fbfbfb')};
    color: ${({ theme }) => (theme === 'one-dark-pro' ? '#ffffff' : '#000000')};
  }

  h2, h3 {
    color: ${({ theme }) => (theme === 'one-dark-pro' ? '#ffffff' : '#333333')};
  }
`;
const Sidebar = styled.div`
  flex: 0 0 30%; // 占据 30% 的宽度
  height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border:1px solid grey
  gap: 20px;
`;

const MainEditor = styled.div`
  flex: 0 0 70%; // 占据 70% 的宽度
  height: 100vh;
`;

const Container = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
`;

const Button = styled.button`
  padding: 10px;
  font-size: 16px;
  border-radius: 10px;
  background-color: #007bff;
  color: #fff;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;
const OutputEditor = styled(MonacoEditor)`
  color: ${({ isError }) => (isError ? '#ffcccc' : 'inherit')};
`;

class CodeEditor extends React.Component {
  constructor() {
    super();
    
    this.state = {
      code: "// type your code... \n",
      theme: "one-dark-pro",
      output: "",
      inputText: "", // 新增状态用于存储输入框内容
      socket: null,
      reconnectAttempts: 0, 
      isError: false 
    };
    this.variables = new Set();
    
  }
  connectWebSocket = () => {
    const socket = new WebSocket("ws://127.0.0.1:5000/ws");
  
    socket.onopen = () => {
      console.log("WebSocket connected");
      this.setState({ socket, reconnectAttempts: 0 });
    };
  
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // 检查消息中是否包含 error 字段
      if (data.error) {
        this.setState((prevState) => ({
          output: prevState.output + data.error,
          isError: true // 标记为错误信息
        }));
      } else {
        this.setState((prevState) => ({
          output: prevState.output + data.output,
          isError: false // 普通信息
        }));
      }
    };
  
    socket.onclose = () => {
      console.log("WebSocket closed, attempting to reconnect...");
      this.setState({ socket: null });
      this.reconnect();
    };
  
    this.setState({ socket });
  };
  
  componentDidMount() {
    this.connectWebSocket()
  }

  reconnect = () => {
    const { reconnectAttempts } = this.state;

    if (reconnectAttempts < 10) { // 限制最大重连次数
      setTimeout(() => {
        console.log(`Reconnection attempt #${reconnectAttempts + 1}`);
        this.setState({ reconnectAttempts: reconnectAttempts + 1 });
        this.connectWebSocket();
      }, 2000); // 设置重连间隔时间，单位为毫秒
    } else {
      console.log("Maximum reconnection attempts reached.");
    }
  };

  componentWillUnmount() {
    if (this.state.socket) {
      this.state.socket.close();
    }
  }
  sendInputToSocket = () => {
    const { socket, inputText } = this.state;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ input: inputText }));
      console.log("Input sent");
      this.setState({inputText: ""})
    }
  };

  editorWillMount = (monaco) => {
    console.log(OneDarkPro);
    console.log(GithubLight);
    monaco.editor.defineTheme("one-dark-pro", OneDarkPro);
    monaco.editor.defineTheme("github-light", GithubLight);

    // 注册自定义语言
    monaco.languages.register({ id: "PseudoCode" });

    monaco.languages.setMonarchTokensProvider("PseudoCode", {
      tokenizer: {
        root: [
          // 忽略的内容，如注释和空格
          [/\/*.*\*\//, "comment"],          // 多行注释
          [/\/\/.*$/, "comment"],            // 单行注释
          [/[ \t]+/, "white"],               // 空格
          
          // 关键字
          [/\b(PROCEDURE|ENDPROCEDURE|FUNCTION|RETURNS|ENDFUNCTION|IF|THEN|ELSE|ENDIF|CASE OF|OF|OTHERWISE|ENDCASE|FOR|TO|STEP|NEXT|REPEAT|UNTIL|WHILE|DO|ENDWHILE|DECLARE|CONSTANT|INPUT|OUTPUT|RETURN|OPENFILE|READFILE|WRITEFILE|CLOSEFILE|CALL|ARRAY|INTEGER|REAL|CHAR|STRING|BOOLEAN|READ|WRITE|TRUE|FALSE|AND|OR|NOT)\b/, "keyword"],
    
          // 符号
          [/[()]/, "@brackets"],               // 括号
          [/\[|\]/, "@brackets"],               // 方括号
          [/\,/, "delimiter"],                  // 逗号
          [/(:|<-|=|<=|>=|<>|<|>|\+|&|-|\*|\/|\^|DIV|MOD)/, "operator"],
    
          // 字面量：数字和字符串
          [/-?[0-9]+(?:\.[0-9]+)?/, "number"],  // 数字
          [/".*?"/, "string"],                  // 字符串
    
          // 标识符（变量名或函数名）
          [/[A-Za-z_][A-Za-z0-9_]*/, "identifier"],
    
          // 其它
          [/./, "invalid"],                     // 未知字符
        ],
      },
    
      // 定义注释样式和配对符号
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"]
      }  
    });    

    monaco.languages.setLanguageConfiguration('PseudoCode', {autoClosingPairs: [
      { open: "(", close: ")", notIn: ["string", "comment"] },
      { open: "[", close: "]", notIn: ["string", "comment"] },
      { open: "{", close: "}", notIn: ["string", "comment"] },
      { open: '"', close: '"', notIn: ["string"] },
      { open: '/*', close: '*/', notIn: ["string"] }
    ]} );
    monaco.languages.registerCompletionItemProvider("PseudoCode", {
      provideCompletionItems: (model, position) => {
        // 获取当前文本内容
        const code = model.getValue();
        this.variables.clear();
        // 提取 DECLARE 声明的变量名
        const declareRegex = /\bDECLARE\b\s+([A-Za-z_][A-Za-z0-9_]*):/g;
        let match;
        while ((match = declareRegex.exec(code)) !== null) {
          const variableName = match[1];
          this.variables.add(variableName);
        }

        // 提取 FOR 循环中定义的变量名
        const forLoopRegex = /\bFOR\b\s+([A-Za-z_][A-Za-z0-9_]*)\s*<-/g;
        while ((match = forLoopRegex.exec(code)) !== null) {
          const variableName = match[1];
          this.variables.add(variableName);
        }

        // 将变量名添加到补全项
        const variableSuggestions = Array.from(this.variables).map((variable) => ({
          label: variable,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: variable,
          documentation: "User-defined variable",
        }));

        return {suggestions:[
          ...variableSuggestions,
          {
            label: "PROCEDURE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "PROCEDURE",
            documentation: "Defines a new procedure"
          },
          {
            label: "ENDPROCEDURE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "ENDPROCEDURE",
            documentation: "Ends a procedure"
          },
          {
            label: "FUNCTION",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "FUNCTION",
            documentation: "Defines a new function"
          },
          {
            label: "RETURNS",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "RETURNS",
            documentation: "Specifies the return type of a function"
          },
          {
            label: "ENDFUNCTION",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "ENDFUNCTION",
            documentation: "Ends a function definition"
          },
          {
            label: "IF",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "IF",
            documentation: "Conditional statement"
          },
          {
            label: "THEN",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "THEN",
            documentation: "Used with IF"
          },
          {
            label: "ELSE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "ELSE",
            documentation: "Else block in IF-ELSE"
          },
          {
            label: "ENDIF",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "ENDIF",
            documentation: "Ends an IF block"
          },
          {
            label: "CASE OF",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "CASE OF",
            documentation: "Switch case-like structure"
          },
          {
            label: "OF",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "OF",
            documentation: "Used in CASE OF"
          },
          {
            label: "OTHERWISE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "OTHERWISE",
            documentation: "Default case in CASE OF"
          },
          {
            label: "ENDCASE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "ENDCASE",
            documentation: "Ends a CASE OF block"
          },
          {
            label: "FOR",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "FOR",
            documentation: "For loop"
          },
          {
            label: "TO",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "TO",
            documentation: "Used in FOR loop"
          },
          {
            label: "STEP",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "STEP",
            documentation: "Increment in FOR loop"
          },
          {
            label: "NEXT",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "NEXT",
            documentation: "End of FOR loop"
          },
          {
            label: "REPEAT",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "REPEAT",
            documentation: "Repeat loop"
          },
          {
            label: "UNTIL",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "UNTIL",
            documentation: "Used with REPEAT"
          },
          {
            label: "WHILE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "WHILE",
            documentation: "While loop"
          },
          {
            label: "DO",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "DO",
            documentation: "Used with WHILE"
          },
          {
            label: "ENDWHILE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "ENDWHILE",
            documentation: "Ends a WHILE loop"
          },
          {
            label: "DECLARE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "DECLARE",
            documentation: "Declares a variable"
          },
          {
            label: "CONSTANT",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "CONSTANT",
            documentation: "Declares a constant"
          },
          {
            label: "INPUT",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "INPUT",
            documentation: "Input statement"
          },
          {
            label: "OUTPUT",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "OUTPUT",
            documentation: "Output statement"
          },
          {
            label: "RETURN",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "RETURN",
            documentation: "Return statement"
          },
          {
            label: "OPENFILE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "OPENFILE",
            documentation: "File open operation"
          },
          {
            label: "READFILE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "READFILE",
            documentation: "File read operation"
          },
          {
            label: "WRITEFILE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "WRITEFILE",
            documentation: "File write operation"
          },
          {
            label: "CLOSEFILE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "CLOSEFILE",
            documentation: "File close operation"
          },
          {
            label: "CALL",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "CALL",
            documentation: "Call function or procedure"
          },
          {
            label: "ARRAY",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "ARRAY",
            documentation: "Array declaration"
          },
          {
            label: "INTEGER",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "INTEGER",
            documentation: "Integer data type"
          },
          {
            label: "REAL",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "REAL",
            documentation: "Real number data type"
          },
          {
            label: "CHAR",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "CHAR",
            documentation: "Character data type"
          },
          {
            label: "STRING",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "STRING",
            documentation: "String data type"
          },
          {
            label: "BOOLEAN",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "BOOLEAN",
            documentation: "Boolean data type"
          },
          {
            label: "READ",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "READ",
            documentation: "Read operation"
          },
          {
            label: "WRITE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "WRITE",
            documentation: "Write operation"
          },
          {
            label: "TRUE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "TRUE",
            documentation: "Boolean true value"
          },
          {
            label: "FALSE",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "FALSE",
            documentation: "Boolean false value"
          },
          {
            label: "AND",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "AND",
            documentation: "Logical AND operator"
          },
          {
            label: "OR",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "OR",
            documentation: "Logical OR operator"
          },
          {
            label: "NOT",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "NOT",
            documentation: "Logical NOT operator"
          },
          {
            label: "SUBSTRING",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "SUBSTRING",
            documentation: "SUBSTRING(string, startindex, endindex), Extracts a substring from a string"
          },
          {
            label: "RANDOM",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "RANDOM",
            documentation: "RANDOM() returns a value -> [0,1] (0 to 1 inclusive)"
          },
          {
            label: "LENGTH",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "LENGTH",
            documentation: "LENGTH(string) returns the length of the string"
          },
          {
            label: "LCASE",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "LCASE",
            documentation: "LCASE(string) returns the lower case of the string"
          },
          {
            label: "UCASE",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "UCASE",
            documentation: "UCASE(string) returns the upper case of the string"
          }
        ]};
      }
  })
  }
  onChange = (newValue) => {
    this.setState({ code: newValue });
  };

  toggleTheme = () => {
    const newTheme = this.state.theme === 'github-light' ? 'one-dark-pro' : 'github-light';
    this.setState({ theme: newTheme });
    document.body.style.backgroundColor = newTheme === 'one-dark-pro' ? '#121212' : '#ffffff';
    document.div.style.backgroundColor = newTheme === 'one-dark-pro' ? '#121212' : '#ffffff';
    document.h3.style.color = newTheme === 'one-dark-pro' ? '#ffffff' : '#000000';
    document.h2.style.color = newTheme === 'one-dark-pro' ? '#ffffff' : '#000000';
  };

  editorDidMount = (editor) => {
    this.editor = editor;
  };

  changeEditorValue = () => {
    if (this.editor) {
      this.editor.setValue("// code changed! \n");
    }
  };

  changeBySetState = () => {
    this.setState({ code: "// code changed by setState! \n" });
  };

  setDarkTheme = () => {
    this.setState({ theme: "one-dark-pro" });
  };

  setLightTheme = () => {
    this.setState({ theme: "github-light" });
  };

  runCode = () => {
    const { socket, code } = this.state;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ code }));
      this.setState({ output: "", isError: false });
    }
  };

  handleInputChange = (newValue) => {
    this.setState({ inputText: newValue });
  };

  render() {
    const { code, theme, output, inputText, isError } = this.state;
    return (
      <Container>
        <GlobalStyle theme={theme} />
        <Sidebar>
          <Button onClick={this.runCode}>Run Code</Button>
          <Button onClick={this.toggleTheme}>
            {theme === 'github-light' ? 'Switch to Dark' : 'Switch to Light'}
          </Button>
          <h3>Input</h3>
          <MonacoEditor
            height="200"
            language="plaintext"
            value={inputText}
            options={{ selectOnLineNumbers: true,
              renderLineHighlight: "all",
              renderSelectionHighlight: true }}
            onChange={this.handleInputChange}
            theme={theme}
          />
          <Button onClick={this.sendInputToSocket}>Send</Button>
          <h3>Output</h3>
          <OutputEditor
            height="200"
            language="plaintext"
            value={output}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              renderLineHighlight: "none",
            }}
            theme={theme}
            isError={isError} // 根据 isError 设置背景颜色
          />
        </Sidebar>
        <MainEditor>
          <MonacoEditor
            height="100vh"
            width="100%"
            language="PseudoCode"
            value={code}
            options={{ selectOnLineNumbers: true,
              renderLineHighlight: "all",
              renderSelectionHighlight: true }}
            onChange={this.onChange}
            theme={theme}
            editorWillMount={this.editorWillMount}
          />
        </MainEditor>
      </Container>
    );
  }
}



const App = () => (
  <div>
    <h2>Pseudo Editor</h2>
    <CodeEditor />
    <hr />
  </div>
);

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
