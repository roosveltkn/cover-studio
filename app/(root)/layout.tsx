// Layout racine distinct pour « / » : cette page n'a pas de langue, elle redirige
// vers /fr ou /en. Elle ne charge ni polices ni styles de l'application.
export default function RootRedirectLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
