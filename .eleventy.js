const { DateTime } = require("luxon");
const fs = require("fs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");



// Custom additions
const MinifyCSS = require("clean-css");
const slugify = require("slugify");




module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(pluginRss);
	eleventyConfig.addPlugin(pluginSyntaxHighlight);
	eleventyConfig.addPlugin(pluginNavigation);

	eleventyConfig.setDataDeepMerge(true);

	eleventyConfig.addLayoutAlias("post", "source/layouts/post.njk");

	eleventyConfig.addFilter("readableDate", dateObj => {
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
	});

	// https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
	eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	eleventyConfig.addCollection("tagList", function(collection) {
		let tagSet = new Set();
		collection.getAll().forEach(function(item) {
			if( "tags" in item.data ) {
				let tags = item.data.tags;

				tags = tags.filter(function(item) {
					switch(item) {
						// this list should match the `filter` list in tags.njk
						case "all":
						case "nav":
						case "post":
						case "posts":
							return false;
					}

					return true;
				});

				for (const tag of tags) {
					tagSet.add(tag);
				}
			}
		});

		// returning an array in addCollection works in Eleventy 0.5.3
		return [...tagSet];
	});




	// Custom
	eleventyConfig.addFilter("minifyCSS", function(code) {
		return new MinifyCSS({}).minify(code).styles;
	});

	eleventyConfig.addFilter("slugURL", function(urlString) {
		return slugify(urlString, {
			replacement: '-',
			remove: undefined,
			lower: true,
			strict: true
		});
	});

	eleventyConfig.addShortcode("dateYear", function() {
		/* {% dateYear %} */
		return DateTime.local().toFormat("yyyy");
	});



	eleventyConfig.addShortcode("icon", function(name) {
		/* {% icon house %} */
		let iconName = "node_modules/bootstrap-icons/icons/" + name + ".svg";
		return fs.readFileSync(iconName).toString();
	})


	eleventyConfig.addShortcode("embedVideo", function(videoID) {
		return "<div class='ratio ratio-16x9'><iframe src='https://www.youtube-nocookie.com/embed/" + videoID + "' allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe></div>";
	});



	eleventyConfig.addPassthroughCopy({"source/images": "/images"});
	eleventyConfig.addPassthroughCopy({"source/manifest.json": "/manifest.json"});
	eleventyConfig.addPassthroughCopy({"source/robots.txt": "robots.txt"});
	eleventyConfig.addPassthroughCopy({"source/_includes/partial-css/bootstrap.css": "/css/bootstrap.css"});
	eleventyConfig.addPassthroughCopy({"source/_includes/partial-js/bootstrap.js": "/js/bootstrap.js"});

	//eleventyConfig.addPassthroughCopy({"source/_includes/partial-js/deploy-js-folder": "/js"});

	// APIs
	//eleventyConfig.addPassthroughCopy({"source/_data/ranking.json": "/js/ranking.json"});





	function generateRankingInfo(type) {

		let targetFile;
		switch (type) {
			case "individual": targetFile = "ranking.json"; break;
			case "team": targetFile = "rankingTeam.json"; break;
			default: return false;
		}

		let rankingFile = fs.readFileSync("source/_data/" + targetFile, "utf8");
		let rankingJSON = JSON.parse(rankingFile);

		let gamesFile = fs.readFileSync("source/_data/games.json", "utf8");
		let gamesJSON = JSON.parse(gamesFile);

		rankingJSON.forEach(function(rank) {
			let totalWins = 0;
			let totalLosses = 0;

			rank["games"].forEach(function(item) {
				totalWins += item.win;
				totalLosses += item.loss;
				item["name"] = gamesJSON[item.id].name;
			});

			let sortedGames = rank["games"].sort(function(a, b) {
				let textA = a['name'];
				let textB = b['name'];

				//return (textA < textB) ? 1 : (textA > textB) ? -1 : 0; // for descending
				return (textA < textB) ? -1 : (textA > textB) ? 1 : 0; // for ascending.
			});

			rank["wins"] = totalWins;
			rank["losses"] = totalLosses;
			rank["record"] = rank.wins - rank.losses;
			rank["games"] = sortedGames;
		})

		let sortedRanks = rankingJSON.sort(function(a, b) {
			let textA = a['record'];
			let textB = b['record'];

			return (textA < textB) ? 1 : (textA > textB) ? -1 : 0;
			//return (textA < textB) ? -1 : (textA > textB) ? 1 : 0; //for ascending.
		});

		//console.log(sortedRanks);
		sortedRanks = JSON.stringify(sortedRanks);

		fs.writeFileSync("source/_data/compiled/" + targetFile, sortedRanks, function (err) {
			if (err) throw err;
			console.log('Saved! 1');
		});
	}


	function generateGamesInfo() {

		let gamesFile = fs.readFileSync("source/_data/games.json", "utf8");
		let gamesJSON = JSON.parse(gamesFile);

		let rankingFile = fs.readFileSync("source/_data/ranking.json", "utf8");
		let rankingJSON = JSON.parse(rankingFile);

		let rankingTeamFile = fs.readFileSync("source/_data/rankingTeam.json", "utf8");
		let rankingTeamJSON = JSON.parse(rankingTeamFile);

		rankingTeamJSON.forEach(function(rankObject) {
			rankingJSON.push(rankObject);
		})


		for(let game in gamesJSON) {
			let id = gamesJSON[game].id;
			let name = gamesJSON[game].name;
			let url = gamesJSON[game].url;
			let desc = gamesJSON[game].description;

			rankingJSON.forEach(function(rank) {
				let totalWins = 0;
				let totalLosses = 0;

				rank["games"].forEach(function(item) {
					if(item.id === id) {
						totalWins += item['win'];
						totalLosses += item['loss'];
					}
				});

				rank["games"] = [];
				rank["wins"] = totalWins;
				rank["losses"] = totalLosses;
				rank["record"] = rank.wins - rank.losses;
			});

			rankingJSON = rankingJSON.filter(function(rank) {
				if(rank["wins"] === 0 && rank["losses"] === 0) {
					// skip over this person
				} else {
					return rank;
				}
			})

			let sortedRanks = rankingJSON.sort(function(a, b) {
				let textA = a['record'];
				let textB = b['record'];

				return (textA < textB) ? 1 : (textA > textB) ? -1 : 0;
				//return (textA < textB) ? -1 : (textA > textB) ? 1 : 0; //for ascending.
			});

			sortedRanks = JSON.stringify(sortedRanks);

			fs.writeFileSync("source/_data/compiled/ranking/" + url + ".json", sortedRanks, function (err) {
				if (err) throw err;
				console.log('Saved! 3');
			});
		}

		console.info("Done with the file generation");
	}


	generateRankingInfo("individual");
	generateRankingInfo("team");
	generateGamesInfo();


	// APIs
	eleventyConfig.addPassthroughCopy({"source/_data/compiled/ranking.json": "/js/ranking.json"});
	eleventyConfig.addPassthroughCopy({"source/_data/compiled/rankingTeam.json": "/js/rankingTeam.json"});
	eleventyConfig.addPassthroughCopy({"source/_data/compiled/ranking": "/js/ranking"});



	/* Markdown Overrides */
	let markdownLibrary = markdownIt({
		html: true,
		breaks: true,
		linkify: true
	}).use(markdownItAnchor, {
		permalink: true,
		permalinkClass: "direct-link",
		permalinkSymbol: "#"
	});
	eleventyConfig.setLibrary("md", markdownLibrary);

	// Browsersync Overrides
	eleventyConfig.setBrowserSyncConfig({
		callbacks: {
			ready: function(err, browserSync) {
				const content_404 = fs.readFileSync('_site/404.html');

				browserSync.addMiddleware("*", (req, res) => {
					// Provides the 404 content without redirect.
					res.write(content_404);
					res.end();
				});
			},
		},
		ui: false,
		ghostMode: false
	});

	return {
		templateFormats: [
			"md",
			"njk",
			"html",
			"liquid"
		],

		// If your site lives in a different subdirectory, change this.
		// Leading or trailing slashes are all normalized away, so don’t worry about those.

		// If you don’t have a subdirectory, use "" or "/" (they do the same thing)
		// This is only used for link URLs (it does not affect your file structure)
		// Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

		// You can also pass this in on the command line using `--pathprefix`
		// pathPrefix: "/",

		markdownTemplateEngine: "liquid",
		htmlTemplateEngine: "njk",
		dataTemplateEngine: "njk",

		// These are all optional, defaults are shown:
		dir: {
			input: ".",
			includes: "source/_includes",
			data: "source/_data",
			output: "_site"
		}
	};
};
