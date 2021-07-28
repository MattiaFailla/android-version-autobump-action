# android-version-autobump-action

Automatically bump android project version when merging to production

This Action bumps the version in build.gradle and pushes it back to the repo. It is meant to be used on every successful
merge to master but you'll need to configured that workflow yourself. You can look to the
[`.example_push.yml`](./example_push.yml) file in this project as an example.

**Attention**

Make sure you use the `actions/checkout@v2` action!

### Workflow

* Based on the commit messages, increment the version from the latest release.
    * If the string "BREAKING CHANGE", "major" or the Attention pattern `refactor!: drop support for Node 6` is found
      anywhere in any of the commit messages or descriptions the major version will be incremented.
    * If a commit message begins with the string "feat" or includes "minor" then the minor version will be increased.
      This works for most common commit metadata for feature additions: `"feat: new API"` and `"feature: new API"`.
    * If a commit message contains the word "pre-alpha" or "pre-beta" or "pre-rc" then the pre-release version will be
      increased (for example specifying pre-alpha: 1.6.0-alpha.1 -> 1.6.0-alpha.2 or, specifying pre-beta: 1.6.0-alpha.1
      -> 1.6.0-beta.0)
    * All other changes will increment the patch version.
* Push the bumped version in build.gradle back into the repo.
* Push a tag for the new version back into the repo.

### Usage:

**GRADLE_PATH:** Param to parse the location of the desired build.gradle file *(required)*. Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GRADLE_PATH: './android/app/build.gradle'
```

**tag-prefix:** Prefix that is used for the git tag  (optional). Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    tag-prefix: 'v'
```

**skip-tag:** The tag is not added to the git repository  (optional). Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    skip-tag: 'true'
```

**default:** Set a default version bump to use  (optional - defaults to patch). Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    default: prerelease
```

**preid:** Set a preid value will building prerelease version  (optional - defaults to 'rc'). Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    default: prerelease
    preid: 'prc'
```

**wording:** Customize the messages that trigger the version bump. It must be a string, case sensitive, coma
separated  (optional). Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    minor-wording: 'add,Adds,new'
    major-wording: 'MAJOR,cut-major'
    patch-wording: 'patch,fixes'     # Providing patch-wording will override commits
    # defaulting to a patch bump.
    rc-wording: 'RELEASE,alpha'
```

**TARGET-BRANCH:** Set a custom target branch to use when bumping the version. Useful in cases such as updating the
version on master after a tag has been set (optional). Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    target-branch: 'master'
```

**commit-message:** Set a custom commit message for version bump commit. Useful for skipping additional workflows run on
push. Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    commit-message: 'CI: bumps version to {{version}} [skip ci]'
```

**push:** Set false you want to avoid pushing the new version tag/package.json. Example:

```yaml
- name: 'Android autobump version'
  uses: 'MattiaFailla/android-version-autobump-action@main'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    push: false
```