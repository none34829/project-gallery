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

