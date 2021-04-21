const parse = require("@babel/parser").parse
const traverse = require("@babel/traverse").default
const t = require("@babel/types")
const core = require("@babel/core")

const isfunctionNode = node =>
  t.isFunctionDeclaration(node, {
    async: true
  }) ||
  t.isArrowFunctionExpression(node, {
    async: true
  }) ||
  t.isFunctionExpression(node, {
    async: true
  }) ||
  t.isObjectMethod(node, {
    async: true
  })

export default function tryCatchPlugin(options = {}) {
    // 默认配置
    const DEFAULT = {
      catchCode: identifier => `console.error(${identifier})`,
      identifier: "e",
      finallyCode: null
    }
    options = Object.assign(DEFAULT, options)
    if (typeof options.catchCode === "function") {
      options.catchCode = options.catchCode(options.identifier);
    }
    let catchNode = parse(options.catchCode).program.body;
    let finallyNode = options.finallyCode && parse(options.finallyCode).program.body;

    return {
        name: 'try-catch-plugin',
        renderChunk(code, id) {
            let ast = parse(code, {
              sourceType: "module", // 支持 es6 module
              plugins: ["dynamicImport"] // 支持动态 import
            })

            traverse(ast, {
              AwaitExpression(path) {
                // 递归向上找异步函数的 node 节点
                while (path && path.node) {
                  let parentPath = path.parentPath;
                  if (
                    t.isBlockStatement(path.node) &&
                    isfunctionNode(parentPath.node)
                  ) {
                    let tryCatchAst = t.tryStatement(
                      path.node,
                      t.catchClause(
                        t.identifier(options.identifier),
                        t.blockStatement(catchNode)
                      ),
                      finallyNode && t.blockStatement(finallyNode)
                    );
                    path.replaceWithMultiple([tryCatchAst]);
                    return;
                  } else if (
                    // 已经包含 try 语句则直接退出
                    t.isBlockStatement(path.node) &&
                    t.isTryStatement(parentPath.node)
                  ) {
                    return;
                  }
                  path = parentPath;
                }
              }
            })

            return core.transformFromAstSync(ast, null, {
              configFile: false // 屏蔽 babel.config.js，否则会注入 polyfill 使得调试变得困难
            }).code;
        }
    }
}