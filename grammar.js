/**
 * @file GN grammar for tree-sitter
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 */

/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  LOGICAL_OR: 1,
  LOGICAL_AND: 2,
  EQUALITY: 3,
  COMPARE: 4,
  ADD: 4,
  CALL: 5,
  MEMBER: 6,
  UNARY: 7,
};

module.exports = grammar({
  name: 'gn',

  externals: $ => [
    $._string_content,
  ],

  extras: $ => [
    /\s/,
    $.comment,
  ],

  supertypes: $ => [
    $.statement,
    $.expression,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($.statement),

    statement: $ => choice(
      $.import_statement,
      $.if_statement,
      $.foreach_statement,
      $.assignment_statement,
      $.expression,
    ),

    import_statement: $ => seq(
      'import',
      '(',
      $.expression,
      ')',
    ),

    if_statement: $ => prec.right(seq(
      'if',
      '(',
      field('condition', $.expression),
      ')',
      field('consequence', $.block),
      repeat($.else_statement),
    )),

    else_statement: $ => seq(
      'else',
      field('alternative', choice($.if_statement, $.block)),
    ),

    foreach_statement: $ => seq(
      'foreach',
      '(',
      field('item', $.identifier),
      ',',
      field('list', $.expression),
      ')',
      $.block,
    ),

    block: $ => seq(
      '{',
      repeat($.statement),
      '}',
    ),

    assignment_statement: $ => seq(
      choice($.identifier, $.array_access, $.scope_access),
      choice('=', '+=', '-='),
      $.expression,
    ),

    expression: $ => choice(
      $.unary_expression,
      $.binary_expression,
      $.primary_expression,
    ),

    primary_expression: $ => choice(
      $.identifier,
      $.integer,
      $.string,
      $.boolean,
      $.call_expression,
      $.array_access,
      $.scope_access,
      $.block,
      $.parenthesized_expression,
      $.list,
    ),

    unary_expression: $ => prec.left(1, seq(
      '!',
      $.primary_expression,
    )),

    binary_expression: $ => {
      const table = [
        [choice('+', '-'), PREC.ADD],
        [choice('<', '<=', '>', '>='), PREC.COMPARE],
        [choice('==', '!='), PREC.EQUALITY],
        ['&&', PREC.LOGICAL_AND],
        ['||', PREC.LOGICAL_OR],
      ];

      // @ts-ignore
      return choice(...table.map(([operator, precedence]) => prec.left(precedence, seq(
        field('left', $.expression),
        // @ts-ignore
        field('operator', operator),
        field('right', $.expression),
      ))));
    },

    call_expression: $ => prec.left(PREC.CALL, seq(
      field('function', $.identifier),
      '(',
      commaSep($.expression),
      ')',
      optional($.block),
    )),

    array_access: $ => prec.left(PREC.MEMBER, seq(
      field('array', $.expression),
      '[',
      field('index', $.expression),
      ']',
    )),

    scope_access: $ => prec.left(PREC.MEMBER, seq(
      field('scope', $.expression),
      '.',
      field('field', $.identifier),
    )),

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')',
    ),

    list: $ => seq(
      '[',
      commaSep($.expression),
      ']',
    ),

    string: $ => seq(
      '"',
      optional($.string_content),
      '"',
    ),

    string_content: $ => repeat1(choice(
      $.escape_sequence,
      $.expansion,
      $._string_content,
    )),

    escape_sequence: _ => /\\["$\\]/,

    expansion: $ => choice(
      seq('$', choice($.identifier, $.hex)),
      seq('${', choice($.identifier, $.array_access, $.scope_access), '}'),
    ),

    integer: _ => /-?\d+/,

    hex: _ => /0x[0-9a-fA-F]+/,

    boolean: _ => choice('true', 'false'),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    comment: _ => token(seq('#', /.*/)),
  },
});

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)), optional(','));
}
