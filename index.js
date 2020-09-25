#!/usr/bin/env node

const colors = require('colors');
const prompt = require('prompt');
const { Octokit } = require('@octokit/rest');

const schema = {
	properties: {
		'github personal access token': {
			pattern: /[a-z0-9]/,
			message:
				"Token may only contain lowercase characters or numbers. This token must include the 'public_repo' and 'delete_repo' permissions!",
			required: true,
		},
		'github username': {
			pattern: /[a-zA-Z0-9-]/,
			message: 'Username may only contain alphanumeric characters or hyphens.',
			required: true,
		},
		'continue? (y/n)': {
			pattern: /^[yn]/,
			message: "Input must be 'y' or 'n'",
			required: true,
		},
	},
};

let owner;
let githubToken;

const deleteIfIncluded = ['online-web', 'bootcamp-prep'];

async function deleteFlatironRepos() {
	const octokit = new Octokit({
		auth: githubToken,
	});

	let pagesLeft = true;
	let count = 0;
	let data = [];

	while (pagesLeft) {
		let repos;

		try {
			const { data } = await octokit.repos.listForAuthenticatedUser({
				per_page: 100,
				visibility: 'public',
				page: count,
			});

			repos = data;
		} catch (e) {
			return console.log(e.message.red);
		}

		if (repos.length === 0) {
			data = data.flat();
			pagesLeft = false;
		} else {
			data.push(repos);
			count++;
		}
	}

	flatironReposToDelete = data.filter((repo) => {
		let needsDeleted = false;

		deleteIfIncluded.forEach((name) =>
			repo.name.includes(name) ? (needsDeleted = true) : null
		);

		return needsDeleted;
	});

	if (flatironReposToDelete.length === 0) {
		return console.log('Found no Flatiron repos to delete!'.green);
	}

	for (let repo of flatironReposToDelete) {
		try {
			await octokit.repos.delete({
				owner,
				repo: repo.name,
			});
			console.log(`Deleting repo: ${repo.name}`.yellow);
		} catch (err) {}
	}

	console.log('Operation complete :)'.green);
}

function run() {
	console.log('Flatiron Repo Removal\n'.green);

	for (let name of deleteIfIncluded) {
		console.log(
			`- Any public repository that you own with ${name.underline.red} included in the name will be deleted!`
		);
	}

	prompt.start();

	prompt.get(schema, (err, result) => {
		if (err) {
			return console.log('An error occured.'.red);
		}

		githubToken = result['github personal access token'];
		owner = result['github username'];

		const userInput = result['continue? (y/n)'];

		if (userInput === 'y') {
			deleteFlatironRepos();
		}
	});
}

run();
