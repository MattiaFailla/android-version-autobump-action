const {Toolkit} = require('actions-toolkit');
const core = require('@actions/core');
const semver = require('semver')
const fs = require('fs');
const semver2int = require('semver2int');

// Change working directory if user defined GRADLE-PATH

if (process.env.GRADLE_PATH) {
    process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env.GRADLE_PATH}`;
    process.chdir(process.env.GITHUB_WORKSPACE);
}

const gradlePath = core.getInput('GRADLE_PATH');

// Run your GitHub Action!
Toolkit.run(async (tools) => {
    const event = tools.context.payload;

    if (!fs.existsSync(gradlePath)) {
        tools.exit.failure("GRADLE_PATH is invalid, no file found!")
        return;
    }

    console.log("Selecting bump type based on commits message..")

    if (!event.commits) {
        console.log("Couldn't find any commits in this event, incrementing patch version...");
    }

    const tagPrefix = process.env['INPUT_TAG-PREFIX'] || '';
    const messages = event.commits ? event.commits.map((commit) => commit.message + '\n' + commit.body) : [];

    const commitMessage = process.env['INPUT_COMMIT-MESSAGE'] || 'android ci: version bump to {{version}}';
    console.log('commit messages:', messages);
    const commitMessageRegex = new RegExp(commitMessage.replace(/{{version}}/g, `${tagPrefix}\\d+\\.\\d+\\.\\d+`), 'ig');
    const isVersionBump = messages.find((message) => commitMessageRegex.test(message)) !== undefined;

    if (isVersionBump) {
        tools.exit.success('No action necessary because we found a previous bump!');
        return;
    }

    // input wordings for MAJOR, MINOR, PATCH, PRE-RELEASE
    const majorWords = process.env['INPUT_MAJOR-WORDING'].split(',');
    const minorWords = process.env['INPUT_MINOR-WORDING'].split(',');
    const patchWords = process.env['INPUT_PATCH-WORDING'] ? process.env['INPUT_PATCH-WORDING'].split(',') : null;
    const preReleaseWords = process.env['INPUT_RC-WORDING'].split(',');

    console.log('config words:', {majorWords, minorWords, patchWords, preReleaseWords});

    // get default version bump
    let version = process.env.INPUT_DEFAULT;
    let foundWord = null;
    // get the pre-release prefix specified in action
    let preid = process.env.INPUT_PREID;

    // case: if wording for MAJOR found
    if (
        messages.some(
            (message) => /^([a-zA-Z]+)(\(.+\))?(\!)\:/.test(message) || majorWords.some((word) => message.includes(word)),
        )
    ) {
        version = 'major';
    }
    // case: if wording for MINOR found
    else if (messages.some((message) => minorWords.some((word) => message.includes(word)))) {
        version = 'minor';
    }
    // case: if wording for PATCH found
    else if (patchWords && messages.some((message) => patchWords.some((word) => message.includes(word)))) {
        version = 'patch';
    }
    // case: if wording for PRE-RELEASE found
    else if (
        messages.some((message) =>
            preReleaseWords.some((word) => {
                if (message.includes(word)) {
                    foundWord = word;
                    return true;
                } else {
                    return false;
                }
            }),
        )
    ) {
        version = 'prerelease';
    }

    console.log('version action after final decision:', version);

    // case: if nothing of the above matches
    if (version === null) {
        tools.exit.success('No version keywords found, skipping bump.');
        return;
    }

    // Incrementing the version by version tag
    // versionCode — A positive integer [...] -> https://developer.android.com/studio/publish/versioning
    const versionCodeRegexPattern = /versionCode [0-9]+/;
    // versionName — A string used as the version number shown to users [...] -> https://developer.android.com/studio/publish/versioning
    const versionNameRegexPattern = /versionName "[^"]*"/;

    let fileContent = fs.readFileSync(gradlePath);

    console.log(versionNameRegexPattern.exec(fileContent)[0].replace("versionName ", "").replace("\"", "").replace("\"", ""));
    console.log(versionCodeRegexPattern.exec(fileContent)[0].replace("versionCode ", ""));

    let currentVersionName = semver.clean(versionNameRegexPattern.exec(fileContent)[0].replace("versionName ", "").replace("\"", "").replace("\"", ""))
    let currentVersionCode = versionCodeRegexPattern.exec(fileContent)[0].replace("versionCode ", "");
    console.log(`Current version: ${currentVersionName}`);
    let newVersionName = semver.inc(currentVersionName, version);
    let newVersionCode = semver2int(newVersionName);
    console.log(newVersionName);
    console.log(`New version: ${newVersionName}`);
    let newFileContent = fileContent.toString().replace(`versionName "${currentVersionName}"`, `versionName "${newVersionName}"`);
    newFileContent = newFileContent.toString().replace(`versionCode ${currentVersionCode}`, `versionCode ${newVersionCode}`)
    let newVersion;

    // case: if user sets push to false, to skip pushing new tag/package.json
    const push = process.env['INPUT_PUSH']
    if (push === "false" || push === false) {
        tools.exit.success('User requested to skip pushing new tag and package.json. Finished.');
        return;
    }

    // GIT logic
    try {
        // set git user
        await tools.exec('git', [
            'config',
            'user.name',
            `"${process.env.GITHUB_USER || 'Autobump android version'}"`,
        ]);
        await tools.exec('git', [
            'config',
            'user.email',
            `"${process.env.GITHUB_EMAIL || 'gh-action-bump--android-version@users.noreply.github.com'}"`,
        ]);

        let currentBranch = /refs\/[a-zA-Z]+\/(.*)/.exec(process.env.GITHUB_REF)[1];
        let isPullRequest = false;
        if (process.env.GITHUB_HEAD_REF) {
            // Comes from a pull request
            currentBranch = process.env.GITHUB_HEAD_REF;
            isPullRequest = true;
        }
        if (process.env['INPUT_TARGET-BRANCH']) {
            // We want to override the branch that we are pulling / pushing to
            currentBranch = process.env['INPUT_TARGET-BRANCH'];
        }
        // do it in the current checked out github branch (DETACHED HEAD)
        console.log('currentBranch:', currentBranch);

        // Writing the new version to the gradle file
        fs.writeFileSync(gradlePath, newFileContent);

        // Committing
        newVersion = `${tagPrefix}${newVersionName}`;
        await tools.exec('git', ['commit', '-a', '-m', commitMessage.replace(/{{version}}/g, newVersion)]);

        // now go to the actual branch to perform the same versioning
        if (isPullRequest) {
            // First fetch to get updated local version of branch
            await tools.exec('git', ['fetch']);
        }
        await tools.exec('git', ['checkout', currentBranch]);
        fs.writeFileSync(gradlePath, newFileContent);
        newVersion = `${tagPrefix}${newVersionName}`;
        console.log(`::set-output name=newTag::${newVersion}`);
        try {
            // to support "actions/checkout@v1"
            await tools.exec('git', ['commit', '-a', '-m', commitMessage.replace(/{{version}}/g, newVersion)]);
        } catch (e) {
            console.warn(
                'git commit failed because you are using "actions/checkout@v2"; ' +
                'but that doesnt matter because you dont need that git commit, thats only for "actions/checkout@v1"',
            );
        }

        const remoteRepo = `https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
        if (process.env['INPUT_SKIP-TAG'] !== 'true') {
            await tools.exec('git', ['tag', newVersion]);
            await tools.exec('git', ['push', remoteRepo, '--follow-tags']);
            await tools.exec('git', ['push', remoteRepo, '--tags']);
        } else {
            await tools.exec('git', ['push', remoteRepo]);
        }
    } catch (e) {
        tools.log.fatal(e);
        tools.exit.failure('Failed to bump version');
    }
    tools.exit.success('Android version bumped!');
});