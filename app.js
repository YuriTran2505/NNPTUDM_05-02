const API_URL = "https://api.escuelajs.co/api/v1/products";

const tableBody = document.getElementById("productTableBody");

async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    const products = await res.json();

    renderTable(products);
  } catch (error) {
    console.error("Lỗi khi load API:", error);
  }
}

function renderTable(products) {
  tableBody.innerHTML = "";

  products.forEach(product => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.title}</td>
      <td>${product.price}</td>
      <td>${product.category?.name || ""}</td>
      <td>
        <img src="${product.images[0]}" width="60" height="60" style="object-fit:cover">
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

loadProducts();
