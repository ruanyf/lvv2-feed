fetch('./rss.json')
.then(async function (response) {
  const res = await response.json();
  const items = res.items;

  const list = document.querySelector('.list');

  items.forEach(i => {
    const li = document.createElement('li');
    const p = document.createElement('p');
    const host = (new URL(i.url)).hostname;
    p.innerHTML = `<a href="${i.url}" target="_blank">${i.title}</a>（${host}）`;
    li.appendChild(p);
    list.appendChild(li);
  });
})

