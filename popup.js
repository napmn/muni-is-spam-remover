


const selectElement = () => {
  // runs in the context of MUNI IS webpage

  const hoverBox = document.createElement('div');
  hoverBox.style.position = 'absolute';
  // change to whatever highlight color you want
  hoverBox.style.background = 'rgba(255, 0, 0, 0.7)';
  // avoid blocking the hovered element and its surroundings
  hoverBox.style.zIndex = '0';
  document.body.appendChild(hoverBox);

  let previousTarget;
  let post;
  const moveListener = (e) => {
      let target = e.target;
      if (target.className !== 'prispevek') {
        target = target.closest('div.prispevek');
        if (!target) {
          return;
        }
      }
      if (target === hoverBox) {
          // the truely hovered element behind the added hover box
          const hoveredElement = document.elementsFromPoint(e.clientX, e.clientY)[1];
          if (previousTarget === hoveredElement){
              // avoid repeated calculation and rendering
              return;
          } else{
              target = hoveredElement;
          }
      } else{
          previousTarget = target;
      }
      post = target;
      const targetOffset = target.getBoundingClientRect();
      const targetHeight = targetOffset.height;
      const targetWidth = targetOffset.width;
      // add a border around hover box
      const boxBorder = 5;
      hoverBox.style.width = targetWidth + boxBorder * 2 + 'px';
      hoverBox.style.height = targetHeight + boxBorder * 2 + 'px';
      // need scrollX and scrollY to account for scrolling
      hoverBox.style.top = targetOffset.top + window.scrollY - boxBorder + 'px';
      hoverBox.style.left = targetOffset.left + window.scrollX - boxBorder + 'px';
  }

  const removePostsMatchingRegex = (posts, regex) => {
    for (let i = 0; i < posts.length; i++) {
      let anchor = posts[i].querySelector('a');
      if (anchor !== null && regex.test(anchor.href)) {
        posts[i].style.display = 'none';
      }
    }
  }

  const downListener = () => {
    if (!post) {
      return;
    }

    // cleanup
    hoverBox.remove();
    document.removeEventListener('mousemove', moveListener);
    document.removeEventListener('mousedown', downListener);
    document.removeEventListener('keydown', keydownListener);

    const anchor = post.querySelector('a');
    if (anchor !== null) {
      const parts = anchor.href.split('/');
      let patternToIgnore;
      if (parts.length <= 6) {
        // external links?
        patternToIgnore = `${parts.slice(0, 3).join('\/')}.*`;
      } else {
        if (parts[5] === 'predmetove') {
          patternToIgnore = `\/${parts.slice(3, parts.length).join('\/')}.*`
        } else {
          patternToIgnore = `\/${parts.slice(3, 7).join('\/')}.*`;
        }
      }
      chrome.runtime.sendMessage({patternToIgnore: patternToIgnore});

      // remove posts that match new pattern
      let posts = document.getElementsByClassName('prispevek');
      removePostsMatchingRegex(posts, new RegExp(patternToIgnore));
    }
  }

  const keydownListener = (e) => {
    e = e || window.event;
    var isEscape = false;
    if ('key' in e) {
        isEscape = (e.key === 'Escape' || e.key === 'Esc');
    } else {
        isEscape = (e.keyCode === 27);
    }
    if (isEscape) {
      // cleanup
      hoverBox.remove();
      document.removeEventListener('mousemove', moveListener);
      document.removeEventListener('mousedown', downListener);
      document.removeEventListener('keydown', keydownListener);
    }
  }

  document.addEventListener('mousemove', moveListener);
  document.addEventListener('mousedown', downListener);
  document.addEventListener('keydown', keydownListener);
}


const removePosts = () => {
  chrome.storage.sync.get({paths: []}, function(data) {
    const paths = data.paths;
    let posts = document.getElementsByClassName('prispevek');
    const regexes = paths.map((path) => new RegExp(path));

    for (let i = 0; i < posts.length; i++) {
      let anchor = posts[i].querySelector('a');
      if (anchor !== null) {
        for (let j = 0; j < regexes.length; j++) {
          if (regexes[j].test(anchor.href)) {
            posts[i].style.display = 'none';
          }
        }
      }
    }
  });
}


const refreshPatterns = () => {
  chrome.storage.sync.get({paths: []}, function(data) {
    let paths = data.paths;
    for (let i = 0; i < paths.length; i++) {
      let div = document.createElement('div');
      div.className = 'row-container';

      let text = document.createElement('span');
      text.className = 'row-text';
      text.innerHTML = paths[i];

      let removeButton = document.createElement('button');
      removeButton.className = 'row-button';
      removeButton.addEventListener('click', () => {
        chrome.tabs.executeScript(
          { code: `(${ showHiddenPostsMatchingPattern })(${JSON.stringify(paths[i])})` }
        );
        paths.splice(i, 1);
        chrome.storage.sync.set({ paths: paths});
        div.remove();
        if (paths.length === 0) {
          const removeButton = document.getElementById('stop-ignoring-button');
          removeButton.style.display = 'none';
        }
      });
      removeButton.innerHTML = 'X';

      div.append(text);
      div.append(removeButton);

      document.getElementsByClassName('user-patterns')[0].appendChild(div);
    }
  });
};


const showHiddenPostsMatchingPattern = (pattern) => {
  let regex = new RegExp(pattern);
  let posts = document.getElementsByClassName('prispevek');
  if (regex === null) {
    posts.map((p) => p.style.display = 'block');
  }
  Array.from(posts).filter(
    (p) => regex.test(p.querySelector('a')?.href)
  ).map((p) => p.style.display = 'block');
}


const toggleRemoveButtonIfNeeded = () => {
  const removeButton = document.getElementById('stop-ignoring-button');
  chrome.storage.sync.get({paths: []}, (data) => {
    if (data.paths.length === 0) {
      removeButton.style.display = 'none';
    } else {
      removeButton.style.display = 'block';
    }
  })
}


document.addEventListener('DOMContentLoaded', function() {
  refreshPatterns();
  toggleRemoveButtonIfNeeded();

  const addButton = document.getElementById('add-button');
  addButton.addEventListener('click', () => {
    chrome.tabs.executeScript({ code: `(${ selectElement })()` });
    window.close();
  });

  const removeButton = document.getElementById('stop-ignoring-button');
  removeButton.addEventListener('click', () => {
    chrome.tabs.executeScript(
      { code: `(${ showHiddenPostsMatchingPattern })(${JSON.stringify(".*")})` }
    );
    chrome.storage.sync.set({paths: []});
    window.close();
  })


}, false);
