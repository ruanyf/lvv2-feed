fetch('./rss.json')
.then(async function (response) {
  const res = await response.json();
  const items = res.items;

  const list = document.querySelector('.list');

  items.forEach(i => {
    const li = document.createElement('li');
    const p = document.createElement('p');
    const host = (new URL(i.url)).hostname;
    p.innerHTML = `<a href="${i.url}" target="_blank">${i.title}</a>（${timeStr(i.date_modified)}）`;
    li.appendChild(p);
    list.appendChild(li);
  });
})

function timeStr(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false
    });
  } catch(e) {
    return '';
  }
}

