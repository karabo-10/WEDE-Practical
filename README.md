# WEDE5020-Practical

This is my POE of my Web Development project.

---

### Map Update: Human-Readable Address

**Before (showing only coordinates in popup):**  
```javascript
const marker = L.marker(coords).addTo(map);
marker.bindPopup(`${coords[0]}, ${coords[1]}`);

marker.on('click', function () {
  window.open(`https://www.google.com/maps?q=${coords[0]},${coords[1]}`, "_blank");
});
