# Politique de sécurité

## Signaler une vulnérabilité

Ne créez **pas** d'issue publique pour une faille de sécurité.

Utilisez le signalement privé de GitHub : onglet **Security** du dépôt →
**Report a vulnerability**
(<https://github.com/roosveltkn/cover-studio/security/advisories/new>).

Indiquez si possible : la description du problème, les étapes pour le reproduire, la version ou le
commit concerné et l'impact estimé.

Vous recevrez une réponse sous 7 jours. Une fois la faille corrigée, nous la divulguons
publiquement et créditons la personne qui l'a signalée, si elle le souhaite.

## Périmètre

Cover Studio est un site statique qui traite les images dans le navigateur, sans backend. Les
sujets pertinents incluent par exemple le XSS, le traitement non sûr de fichiers importés et les
dépendances vulnérables.

## Versions supportées

Seule la dernière version publiée sur la branche `main` est supportée.
