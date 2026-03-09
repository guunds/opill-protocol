async function getData() {
  const res = await fetch("http://localhost:3000");
  const data = await res.text();

  document.getElementById("result").innerText = data;
}