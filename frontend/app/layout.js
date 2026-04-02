export const metadata = {
  title: 'COGNIS PROTON',
  description: 'Hackathon Project',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
