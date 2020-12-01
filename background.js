let posts = document.getElementsByClassName("prispevek");
for (let i = 0; i < posts.length; i++) {
    let anchor = posts[i].querySelector('a');
    if (anchor !== null && /\/auth\/discussion\/MU*/.test(anchor.href)) {
        posts[i].style.display = "none";
    }
}
