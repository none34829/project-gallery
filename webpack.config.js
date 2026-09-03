const path = require('path');
const fs = require("fs");
const webpack = require('webpack');
const NunjucksWebpackPlugin = require("nunjucks-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { heroBackground, heroGradient, heroImageUrl } = require('./src/js/heroBackground.js');

let data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
// Airtable holds a few projects twice (same title + student, so the same derived
// project_id). That rendered duplicate cards in the gallery, and both cards opened
// the same page - whichever record webpack wrote last. Merge each set into one
// record, preferring populated values and unioning the list fields. related_proj
// stores indices into this array, so it has to be remapped as we collapse it.
function mergeDuplicateProjects(projects) {
  const indexById = {};
  const merged = [];
  const remap = [];
  projects.forEach((proj, oldIndex) => {
    const existing = indexById[proj.project_id];
    if (existing === undefined) {
      indexById[proj.project_id] = merged.length;
      remap[oldIndex] = merged.length;
      merged.push(Object.assign({}, proj));
      return;
    }
    remap[oldIndex] = existing;
    const target = merged[existing];
    Object.keys(proj).forEach(key => {
      if (key === 'related_proj') return;
      const incoming = proj[key];
      const current = target[key];
      if (Array.isArray(incoming) && Array.isArray(current)) {
        incoming.forEach(v => { if (current.indexOf(v) === -1) current.push(v); });
      } else if (current === null || current === undefined || current === '') {
        target[key] = incoming;
      }
    });
  });
  merged.forEach(proj => {
    const seen = {};
    proj.related_proj = (proj.related_proj || [])
      .map(i => remap[i])
      .filter(i => i !== undefined && merged[i] !== proj && !seen[i] && (seen[i] = true));
  });
  return merged;
}
data.projects = mergeDuplicateProjects(data.projects);
// The front page builds its cards client-side from data.json, so the copy shipped
// to dist has to be the deduped one too - otherwise the duplicate cards come back.
// Snapshot it here, before related_proj is expanded into objects further down
// (that turns the structure circular and unserialisable).
const DEDUPED_DATA_JSON = JSON.stringify(data);

// ---------------------------------------------------------------- SEO
// The gallery builds its cards client-side, so the front page ships no links to
// the project pages at all - a crawler arriving without JS has nothing to follow.
// A sitemap is the reliable way to get them discovered, written at build time from
// the same list the pages are generated from so it can never drift.
const SITE = 'https://research.inspiritai.com';

function writeSeoFiles(projects) {
  const dir = path.resolve(__dirname, 'dist');
  fs.mkdirSync(dir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    { loc: SITE + '/', priority: '1.0', freq: 'weekly' },
    { loc: SITE + '/published.html', priority: '0.8', freq: 'weekly' },
  ].concat(projects.map(function (p) {
    return {
      loc: SITE + '/projects/' + p.project_id + '.html',
      priority: '0.7',
      freq: 'monthly',
    };
  }));

  const body = urls.map(function (u) {
    return [
      '  <url>',
      '    <loc>' + u.loc + '</loc>',
      '    <lastmod>' + today + '</lastmod>',
      '    <changefreq>' + u.freq + '</changefreq>',
      '    <priority>' + u.priority + '</priority>',
      '  </url>',
    ].join('\n');
  }).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), xml, 'utf8');

  fs.writeFileSync(path.join(dir, 'robots.txt'), [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: ' + SITE + '/sitemap.xml',
    '',
  ].join('\n'), 'utf8');

  console.log('SEO: wrote sitemap.xml (' + urls.length + ' urls) and robots.txt');
}
// dist is never cleaned, so pages for projects that have since been removed from
// Airtable keep being served - 11 of them were live, returning stale content that
// is in no sitemap and linked from nowhere. Remove any project page whose id is no
// longer in the dataset, plus its bundle.
function pruneOrphanPages(projects) {
  const live = {};
  projects.forEach(function (p) { live[p.project_id] = 1; });
  const projDir = path.resolve(__dirname, 'dist', 'projects');
  const distDir = path.resolve(__dirname, 'dist');
  if (!fs.existsSync(projDir)) return;
  let removed = 0;
  fs.readdirSync(projDir).forEach(function (file) {
    const m = /^([0-9a-f]{40})\.html$/.exec(file);
    if (!m || live[m[1]]) return;
    fs.unlinkSync(path.join(projDir, file));
    const bundle = path.join(distDir, m[1] + '.js');
    if (fs.existsSync(bundle)) fs.unlinkSync(bundle);
    removed++;
  });
  if (removed) console.log('SEO: pruned ' + removed + ' orphaned project pages');
}

writeSeoFiles(data.projects);
pruneOrphanPages(data.projects);

let projects_raw = JSON.parse(JSON.stringify(data.projects))
let prodect_id_map = {}
projects_raw.forEach(proj => {
  const {project_id, ...new_obj} = proj
  prodect_id_map[project_id] = new_obj
})

data.projects.forEach((item, index) => {
  data.projects[index].hero_bg = heroBackground(item);
  data.projects[index].hero_fallback = heroGradient(item);
  data.projects[index].hero_src = heroImageUrl(item);
  // Absolute URL for og:image - social scrapers will not resolve a root-relative
  // path. Left empty when the project has no picture so no broken card is shared.
  const heroSrc = data.projects[index].hero_src;
  // Same clamp createProjectElement() applies, so the server-rendered cards have
  // the identical height and the JS re-render causes no layout shift.
  const ratio = (item.hero_w && item.hero_h) ? item.hero_h / item.hero_w : 0.87;
  data.projects[index].card_ratio = Math.min(1.15, Math.max(0.65, ratio)).toFixed(3);
  data.projects[index].og_image = !heroSrc ? ''
    : (/^https?:\/\//i.test(heroSrc) ? heroSrc : SITE + heroSrc);
})
data.projects.forEach((item, index) => {
  data.projects[index].related_proj = item.related_proj.map(rel => { return data.projects[rel] });
})

let proj_ids = data.projects.map(item => {  
  return {
    from: "./src/html/project.html",
    to: `projects/${item.project_id}.html`,
    context: {ctx :item, isProject: true},
  };
});

let entry_points = { index: './src/js/index.js', published: './src/js/published.js', } 
data.projects.forEach(item => entry_points[item.project_id] = "./src/js/project.js");

 module.exports = {
   entry: entry_points,
   output: {
     filename: '[name].js',
     path: path.resolve(__dirname, 'dist'),
     publicPath: "/"
   },
   devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname),
        publicPath: '/',
      }
    ],
    watchFiles: ['src/**/*', 'data.json']
   },
   module: {
     rules: [
       {
        test: /\.jsx?$/,   // anchored: unanchored this also matched .json and sent it to babel
        exclude: "/node_modules",
        use: {loader: 'babel-loader'}
       },
       {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          {loader:"css-loader", 
            options: {
              url: false
            },
          },
          {
            loader: 'resolve-url-loader',
            // options: {...}
          },
          {
          // Compiles Sass to CSS
            loader: 'sass-loader',
            options: {
              sourceMap: true, // <-- !!IMPORTANT!!
            },
          }
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/fonts/[name].[ext]',
            }
          }
        ]
      },
      // {
      //   test: /\.(jpe?g|png|gif|svg)$/i, 
      //   loader: 'file-loader',
      //   options: {
      //     name: 'assets/images/[name].[ext]'
      //   }
      // },
      // {test: /\.(png|jpg|svg)$/, loader: 'url-loader?limit=8192'},
     ],
   },
   node: {
    fs: "empty"
   },
   plugins: [
    new NunjucksWebpackPlugin({
      templates: [
        {
          from: "./src/html/index.html",
          to: "index.html",
          context: data,
        },
        {
          from: "./src/html/published.html",
          to: "published.html",
          context: data,
        },
        ...proj_ids
      ],
    }),
    // Removed data bundling - data is now loaded dynamically via dataService
    new CopyWebpackPlugin([
      {from:'src/assets/',to:'assets/'},
      {from:'data.json',to:'data.json',transform: () => DEDUPED_DATA_JSON}
    ]), 
  ]
 };

