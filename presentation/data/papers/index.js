/**
 * Deep-dive paper registry.
 * Each entry is a full-page data module for one milestone.
 */
const paperDeepDives = [
  ddpmDeepDive,
  ddimDeepDive,
  vdmDeepDive,
  vLearningDeepDive,
  flowMatchingDeepDive,
  consistencyDeepDive,
  meanflowDeepDive,
  avgDdimDeepDive,
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = paperDeepDives;
}
