/**
 * Peggy.js grammar for the AlgoMotion Animation DSL.
 *
 * This grammar is compiled once at module load time via peggy.generate().
 * The generated parser produces AST nodes matching the types in ./ast.ts.
 *
 * Spec reference: Section 6.6 (Animation DSL)
 */

export const GRAMMAR = String.raw`
// ── AlgoMotion Animation DSL Grammar ──

{
  // Helper to build a left-associative binary expression chain
  function buildBinaryChain(head, tail) {
    return tail.reduce((left, [, op, , right]) => ({
      type: "BinaryExpression",
      operator: op,
      left,
      right,
    }), head);
  }
}

// ── Program ──

Program
  = _ scenes:SceneBlock* _ {
      return { type: "Program", scenes };
    }

// ── Scene Block ──

SceneBlock
  = _ "scene" __ name:StringLiteral _ "{" _ body:StatementList _ "}" _ {
      return { type: "SceneBlock", name: name.value, body };
    }

StatementList
  = stmts:(_ stmt:Statement _ { return stmt; })* { return stmts; }

// ── Statements ──

Statement
  = ElementDeclaration
  / VariableDeclaration
  / ForLoop
  / WhileLoop
  / IfStatement
  / ParallelBlock
  / WaitCommand
  / CameraCommand
  / AudioCommand
  / AnimationCommand
  / Assignment

// ── Element Declaration ──

ElementDeclaration
  = type:ElementType __ name:Identifier _ "=" _ value:Expression pos:(_ "at" _ "(" _ x:Expression _ "," _ y:Expression _ ")" { return { x, y }; })? {
      return {
        type: "ElementDeclaration",
        elementType: type,
        name: name.name,
        value,
        position: pos || undefined,
      };
    }

ElementType
  = "array" / "tree" / "graph" / "node" / "stack" / "queue" / "linkedList" / "matrix" / "hashTable"

// ── Variable Declaration ──

VariableDeclaration
  = "let" __ name:Identifier _ "=" _ value:Expression {
      return { type: "VariableDeclaration", name: name.name, value };
    }

// ── Assignment ──

Assignment
  = target:PostfixExpression _ "=" _ value:Expression {
      return { type: "Assignment", target, value };
    }

// ── For Loop ──

ForLoop
  = "for" __ variable:IdentifierName __ "in" __ start:Expression _ ".." _ end:Expression _ "{" _ body:StatementList _ "}" {
      return { type: "ForLoop", variable, start, end, body };
    }

// ── While Loop ──

WhileLoop
  = "while" __ condition:Expression _ "{" _ body:StatementList _ "}" {
      return { type: "WhileLoop", condition, body };
    }

// ── If Statement ──

IfStatement
  = "if" __ condition:Expression _ "{" _ consequent:StatementList _ "}" alt:(_ "else" _ "{" _ body:StatementList _ "}" { return body; })? {
      return {
        type: "IfStatement",
        condition,
        consequent,
        alternate: alt || undefined,
      };
    }

// ── Animation Commands ──

AnimationCommand
  = command:AnimationCommandName __ targets:TargetList options:CommandOptions {
      return { type: "AnimationCommand", command, targets, options };
    }

AnimationCommandName
  = "highlight" / "unhighlight" / "swap" / "move" / "insert"
  / "delete" / "mark" / "connect" / "disconnect" / "label" / "annotate"

TargetList
  = head:Expression tail:(_ "," _ expr:Expression { return expr; })* {
      return [head, ...tail];
    }

CommandOptions
  = opts:(_ opt:CommandOption { return opt; })* { return opts; }

CommandOption
  = name:CommandOptionName __ value:Expression {
      return { type: "CommandOption", name, value };
    }

CommandOptionName
  = "color" / "duration" / "easing" / "delay" / "stagger" / "label"

// ── Parallel Block ──

ParallelBlock
  = "parallel" _ "{" _ body:StatementList _ "}" {
      return { type: "ParallelBlock", body };
    }

// ── Camera Commands ──

CameraCommand
  = command:CameraCommandName __ args:CameraArgList options:CommandOptions {
      return { type: "CameraCommand", command, args, options };
    }

CameraCommandName
  = "zoom" / "pan" / "focus"

CameraArgList
  = head:Expression tail:(_ "," _ expr:Expression { return expr; })* {
      return [head, ...tail];
    }

// ── Audio Commands ──

AudioCommand
  = sound:AudioCue !IdentifierChar {
      return { type: "AudioCommand", sound };
    }

AudioCue
  = "beep" / "click" / "success" / "error"

// ── Wait/Pause Commands ──

WaitCommand
  = ("wait" / "pause") __ duration:Expression {
      return { type: "WaitCommand", duration };
    }

// ── Expressions (precedence climbing) ──

Expression
  = LogicalOrExpression

LogicalOrExpression
  = head:LogicalAndExpression tail:(_ "||" _ LogicalAndExpression)* {
      return buildBinaryChain(head, tail);
    }

LogicalAndExpression
  = head:EqualityExpression tail:(_ "&&" _ EqualityExpression)* {
      return buildBinaryChain(head, tail);
    }

EqualityExpression
  = head:ComparisonExpression tail:(_ ("==" / "!=") _ ComparisonExpression)* {
      return buildBinaryChain(head, tail);
    }

ComparisonExpression
  = head:AdditiveExpression tail:(_ ("<=" / ">=" / "<" / ">") _ AdditiveExpression)* {
      return buildBinaryChain(head, tail);
    }

AdditiveExpression
  = head:MultiplicativeExpression tail:(_ ("+" / "-") _ MultiplicativeExpression)* {
      return buildBinaryChain(head, tail);
    }

MultiplicativeExpression
  = head:UnaryExpression tail:(_ ("*" / "/" / "%") _ UnaryExpression)* {
      return buildBinaryChain(head, tail);
    }

UnaryExpression
  = "-" _ operand:UnaryExpression {
      return { type: "UnaryExpression", operator: "-", operand };
    }
  / "!" _ operand:UnaryExpression {
      return { type: "UnaryExpression", operator: "!", operand };
    }
  / PostfixExpression

PostfixExpression
  = head:PrimaryExpression tail:(
      "." prop:IdentifierName { return { type: "member", property: prop }; }
    / "[" _ idx:Expression _ "]" { return { type: "index", index: idx }; }
  )* {
      return tail.reduce((obj, accessor) => {
        if (accessor.type === "member") {
          return { type: "MemberExpression", object: obj, property: accessor.property };
        }
        return { type: "IndexExpression", object: obj, index: accessor.index };
      }, head);
    }

PrimaryExpression
  = DurationLiteral
  / NumberLiteral
  / StringLiteral
  / BooleanLiteral
  / ArrayLiteral
  / ObjectLiteral
  / "(" _ expr:Expression _ ")" { return expr; }
  / Identifier

// ── Literals ──

DurationLiteral
  = value:NumberValue unit:("ms" / "s") !IdentifierChar {
      const seconds = unit === "ms" ? value / 1000 : value;
      return { type: "DurationLiteral", value: seconds, unit };
    }

NumberLiteral
  = value:NumberValue !IdentifierChar {
      return { type: "NumberLiteral", value };
    }

NumberValue
  = digits:$([0-9]+ ("." [0-9]+)?) { return parseFloat(digits); }

StringLiteral
  = '"' chars:$([^"]*) '"' { return { type: "StringLiteral", value: chars }; }

BooleanLiteral
  = "true" !IdentifierChar { return { type: "BooleanLiteral", value: true }; }
  / "false" !IdentifierChar { return { type: "BooleanLiteral", value: false }; }

ArrayLiteral
  = "[" _ elements:ArrayElements? _ "]" {
      return { type: "ArrayLiteral", elements: elements || [] };
    }

ArrayElements
  = head:Expression tail:(_ "," _ expr:Expression { return expr; })* {
      return [head, ...tail];
    }

ObjectLiteral
  = "{" _ props:ObjectProperties? _ "}" {
      return { type: "ObjectLiteral", properties: props || [] };
    }

ObjectProperties
  = head:ObjectProperty tail:(_ "," _ prop:ObjectProperty { return prop; })* {
      return [head, ...tail];
    }

ObjectProperty
  = key:IdentifierName _ ":" _ value:Expression {
      return { type: "ObjectProperty", key, value };
    }

Identifier
  = !ReservedWord name:IdentifierName {
      return { type: "Identifier", name };
    }

IdentifierName
  = $([a-zA-Z_][a-zA-Z0-9_]*)

IdentifierChar
  = [a-zA-Z0-9_]

ReservedWord
  = ("scene" / "let" / "for" / "in" / "while" / "if" / "else" / "parallel"
    / "true" / "false" / "at"
    / "wait" / "pause"
    / "highlight" / "unhighlight" / "swap" / "move" / "insert" / "delete"
    / "mark" / "connect" / "disconnect" / "label" / "annotate"
    / "zoom" / "pan" / "focus"
    / "beep" / "click" / "success" / "error"
    / "color" / "duration" / "easing" / "delay" / "stagger"
    / "array" / "tree" / "graph" / "node" / "stack" / "queue"
    / "linkedList" / "matrix" / "hashTable"
    ) !IdentifierChar

// ── Whitespace & Comments ──

_ "whitespace"
  = ([ \t\n\r] / Comment)*

__ "mandatory whitespace"
  = ([ \t\n\r] / Comment)+

Comment
  = "//" [^\n]* ("\n" / !.)
  / "/*" (!"*/" .)* "*/"
`;
