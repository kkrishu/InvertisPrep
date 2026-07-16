import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import axios from 'axios';
import { PYQPaper } from '../models/PYQPaper.js';
import { Syllabus } from '../models/Syllabus.js';

export const viewPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'pyq' or 'syllabus'

    let paper;
    if (type === 'syllabus') {
      paper = await Syllabus.findById(id);
    } else {
      paper = await PYQPaper.findById(id);
    }

    if (!paper) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Fetch PDF from Cloudinary
    const response = await axios.get(paper.cloudinaryUrl, {
      responseType: 'arraybuffer',
    });

    const pdfBytes = response.data;

    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Get user info for watermark
    const userName = req.user.name || 'Anonymous';
    const userEmail = req.user.email || 'N/A';
    const timestamp = new Date().toLocaleString();
    const watermarkText = `Viewed by: ${userName} (${userEmail}) | ${timestamp} | InvertisPrep`;

    // Apply watermark to each page
    pages.forEach((page) => {
      const { width, height } = page.getSize();

      // Diagonal watermark
      page.drawText(watermarkText, {
        x: 50,
        y: height / 2,
        size: 14,
        font: font,
        color: rgb(0.7, 0.7, 0.7), // Light gray
        opacity: 0.3,
        rotate: degrees(45),
      });

      // Bottom watermark
      page.drawText(`Protected by InvertisPrep - ${userEmail}`, {
        x: 20,
        y: 20,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.5,
      });
    });

    const modifiedPdfBytes = await pdfDoc.save();

    // Set headers for inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="paper.pdf"');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    res.send(Buffer.from(modifiedPdfBytes));
  } catch (error) {
    console.error('PDF Proxy error:', error);
    res.status(500).json({ success: false, message: 'Error processing PDF' });
  }
};
