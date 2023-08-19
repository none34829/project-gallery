const path = require('path');
const fs = require("fs");
const webpack = require('webpack');
const NunjucksWebpackPlugin = require("nunjucks-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

let data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
let projects_raw = JSON.parse(JSON.stringify(data.projects))
let prodect_id_map = {}
projects_raw.forEach(proj => {
  const {project_id, ...new_obj} = proj
  prodect_id_map[project_id] = new_obj
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

let entry_points = { index: './src/js/index.js' } 
data.projects.forEach(item => entry_points[item.project_id] = "./src/js/project.js");

 module.exports = {
   entry: entry_points,
   output: {
     filename: '[name].js',
     path: path.resolve(__dirname, 'dist'),
     publicPath: "/"
   },
   devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    watchContentBase: true
   },
   module: {
     rules: [
       {
        test: /\.jsx?/,
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
        ...proj_ids
      ],
    }),
    new webpack.DefinePlugin({
      TOPICS: JSON.stringify({topics: data.topics}),
      TAGS: JSON.stringify({tags: data.tags}),
      TAGSMAP: JSON.stringify({tagsMap: data.tagsMap}),
      PROJECTS: JSON.stringify({projects: prodect_id_map})
    }),
    new CopyWebpackPlugin([
      {from:'src/assets/',to:'assets/'} 
    ]), 
  ]
 };


 