export async function exportElementAsPDF(elementId, filename = '名字解析卷宗.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Export target not found: ${elementId}`);
  }

  const excludes = element.querySelectorAll('.no-export');

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    // 隐藏不想出现在 PDF 中的元素 (如关闭按钮/操作按钮)
    excludes.forEach(el => el.style.display = 'none');

    // 使用 html2canvas 截取带有样式的 DOM
    // 采用较高比例确保视网膜屏幕下的文字和雷达图清晰度
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#F7F3EE' // 月白色背景
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // 计算 PDF 比例 (A4 size: 210 x 297 mm)
    // 根据截图比例动态适应 A4 宽或者高
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  } finally {
    excludes.forEach(el => el.style.display = '');
  }
}
