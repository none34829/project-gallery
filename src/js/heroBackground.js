/**
 * Fallback behind every project hero image.
 *
 * Each project's hero comes from Airtable's `graphic_link`, which is a hotlink to a
 * third-party site. Those rot: at the last audit 34 of 188 no longer loaded. Because
 * they are painted as a CSS background, a dead one fails *silently* to a blank white
 * box, which is what made the gallery look broken.
 *
 * Layering a gradient underneath fixes it with no extra requests and no JS: CSS paints
 * the remote image on top, and if it never arrives the gradient shows through. The
 * gradient is keyed to the project's domain so a dead image reads as a deliberate
 * subject card rather than an error, and the existing dark scrim keeps the overlaid
 * title, student and mentor legible either way.
 *
 * The real fix is repointing those links in Airtable - see BROKEN-IMAGES.md.
 */

// Indigo-family pairs so the grid stays cohesive; hue shifts by subject.
var DOMAIN_TINT = {
  'Healthcare and Biology':               ['#2f3167', '#6d3f7a'],
  'Engineering':                          ['#2b3a6b', '#3f6d8a'],
  'Environment':                          ['#24513f', '#2f6d5a'],
  'Physics':                              ['#1f2f5e', '#4a4e8c'],
  'Humanitarian Efforts and Social Justice': ['#5a2f52', '#8a4a63'],
  'Business and Finance':                 ['#2f4a3a', '#4f7a52'],
  'Language and Literature':              ['#4a2f5e', '#6d4a8a'],
  'Psychology':                           ['#3f2f5e', '#5e4a8a'],
  'Arts and Music':                       ['#6b2f4a', '#9a4a63'],
  'Education':                            ['#2f4a6b', '#4a6d9a'],
  'PoliSci and Law':                      ['#3a3a5e', '#5a5a8a'],
  'Sports and Motion Sciences':           ['#2f5a5e', '#3f8a8a'],
  'Journalism':                           ['#4a3a2f', '#7a5e3f'],
  'Cybersecurity':                        ['#1f2f3f', '#3a5a6b'],
  'Generative AI':                        ['#3f2f6b', '#6b4a9a'],
  'Specific Technologies':                ['#2f3f5e', '#4a5e8a'],
  'Published Papers and Science Fairs':   ['#2f3167', '#55578e'],
  'Misc':                                 ['#3a3a4a', '#5e5e6d']
};
var DEFAULT_TINT = ['#2f3167', '#55578e'];

function tintFor(project) {
  var domains = (project && project.domains) || [];
  for (var i = 0; i < domains.length; i++) {
    if (DOMAIN_TINT[domains[i]]) return DOMAIN_TINT[domains[i]];
  }
  return DEFAULT_TINT;
}

/** CSS `background` value: remote image on top, subject gradient underneath. */
function heroBackground(project) {
  var tint = tintFor(project);
  var gradient = 'linear-gradient(160deg, ' + tint[0] + ' 0%, ' + tint[1] + ' 100%)';
  var url = project && project.graphic_link;
  if (!url) return gradient;
  // single quotes would terminate the url('...') wrapper in the inline style
  return "url('" + String(url).replace(/'/g, '%27') + "') center 50% / cover no-repeat, " + gradient;
}

/** Just the subject gradient, for places that need a standalone fallback. */
function heroGradient(project) {
  var tint = tintFor(project);
  return 'linear-gradient(160deg, ' + tint[0] + ' 0%, ' + tint[1] + ' 100%)';
}

module.exports = { heroBackground: heroBackground, heroGradient: heroGradient, tintFor: tintFor };
