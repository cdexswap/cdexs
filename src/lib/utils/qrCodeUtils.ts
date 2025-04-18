import QRCode from "qrcode";

// Generate QR code as data URL with custom options
export async function generateQRCode(link: string): Promise<string> {
  try {

    const qrCodeDataUrl = await QRCode.toDataURL(link, {
      errorCorrectionLevel: "H",
      margin: 1,
      color: {
        dark: "#3B82F6", // Blue color for the QR code
        light: "#FFFFFF", // White background
      },
      width: 300,
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}
