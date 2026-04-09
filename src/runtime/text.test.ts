import { expect, test } from "bun:test"

import {
  replaceIntroBeforeMarker,
  rewriteMessagePartsInPlace,
  rewriteStringsInPlace,
  sortByLengthDesc,
} from "./text"

test("prefix pairs prefer the most specific match", () => {
  const pairs = sortByLengthDesc([
    { builtin: "abc", override: "A" },
    { builtin: "abcdef", override: "B" },
    { builtin: "abc", override: "C", priority: 1 },
  ])

  expect(pairs.map((pair) => pair.override)).toEqual(["B", "C", "A"])

  const strings = ["abcdef tail", "abc tail", "noop"]
  rewriteStringsInPlace(strings, pairs)

  expect(strings).toEqual(["B tail", "C tail", "noop"])
})

test("intro replacement preserves the existing newline style", () => {
  const crlf = replaceIntroBeforeMarker("old intro\r\n<available_skills>\r\nnext", "new intro", ["<available_skills>"])
  const lf = replaceIntroBeforeMarker("old intro\n<available_skills>\nnext", "new intro", ["<available_skills>"])

  expect(crlf).toBe("new intro\r\n<available_skills>\r\nnext")
  expect(lf).toBe("new intro\n<available_skills>\nnext")
})

test("message rewriting only touches text parts", () => {
  const messages = [
    {
      parts: [
        { type: "text", text: "build me" },
        { type: "tool-call", text: "build me" },
      ],
    },
  ]

  rewriteMessagePartsInPlace(messages, [{ builtin: "build", override: "ship" }])

  expect(messages).toEqual([
    {
      parts: [
        { type: "text", text: "ship me" },
        { type: "tool-call", text: "build me" },
      ],
    },
  ])
})
