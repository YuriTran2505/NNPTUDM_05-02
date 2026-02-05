const API_URL = "https://api.escuelajs.co/api/v1/products";

const productsContainer = document.getElementById("productsContainer");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const loadingContainer = document.getElementById("loadingContainer");
const noResults = document.getElementById("noResults");

let allProducts = [];
let selectedCategory = "all";

async function loadProducts() {
  loadingContainer.style.display = "block";
  productsContainer.innerHTML = "";
  noResults.style.display = "none";

  try {
    const res = await fetch(API_URL);
    allProducts = await res.json();
    renderProducts(allProducts);
  } catch (error) {
    console.error("Lỗi khi load API:", error);
    noResults.style.display = "block";
    noResults.innerHTML = '<i class="fas fa-exclamation-circle"></i><p>Có lỗi khi tải dữ liệu</p>';
  } finally {
    loadingContainer.style.display = "none";
  }
}

function renderProducts(products) {
  productsContainer.innerHTML = "";

  if (products.length === 0) {
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imageUrl = product.images && product.images[0] 
      ? product.images[0].replace(/["\[\]]/g, '') 
      : 'https://via.placeholder.com/220x220?text=No+Image';

    const categoryName = product.category?.name || "Khác";
    const description = product.description || "Không có mô tả sản phẩm";

    card.innerHTML = `
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/220x220?text=Image+Error'">
        <div class="product-description">${description}</div>
      </div>
      <div class="product-info">
        <span class="product-category">${categoryName}</span>
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">$${product.price}</div>
        <div class="product-id">ID: #${product.id}</div>
      </div>
    `;

    productsContainer.appendChild(card);
  });
}

function filterProducts() {
  let filtered = allProducts;

  // Lọc theo danh mục
  if (selectedCategory !== "all") {
    filtered = filtered.filter(product => 
      product.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  // Tìm kiếm theo tên sản phẩm
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(product =>
      product.title.toLowerCase().includes(searchTerm) ||
      product.category?.name?.toLowerCase().includes(searchTerm)
    );
  }

  renderProducts(filtered);
}

// Event listeners
searchInput.addEventListener("input", filterProducts);

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.getAttribute("data-category");
    filterProducts();
  });
});

// Load products on page load
loadProducts();
