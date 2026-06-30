# Procédure de Réalisation d'un Audit de Sécurité CIS PostgreSQL 15

Ce guide présente la méthodologie complète pour auditer la sécurité de votre instance **PostgreSQL 15** conformément au benchmark **CIS v1.2.0** en utilisant le script d'audit automatisé fourni.

---

## 1. Prérequis à l'exécution de l'audit

Avant de lancer le script d'audit, assurez-vous que l'environnement cible remplit les conditions suivantes :

### A. Exigences Système & Utilitaires
- **Client PostgreSQL (`psql`)** : L'utilitaire en ligne de commande `psql` doit être installé sur la machine d'où l'audit est exécuté.
  - *Installation sur Debian/Ubuntu* : `sudo apt-get install postgresql-client`
  - *Installation sur RedHat/RHEL/CentOS* : `sudo dnf install postgresql`
- **Droits Système (OS)** : Pour que le contrôle physique des fichiers (**2.1 Permissions sur PGDATA**) fonctionne correctement, le script doit idéalement être exécuté :
  - Soit directement sur le serveur hébergeant la base de données.
  - Soit par un utilisateur ayant des droits de lecture/exécution sur le dossier `$PGDATA` (généralement l'utilisateur système `postgres` ou un membre du groupe `postgres`).

### B. Privilèges de Base de Données (PostgreSQL)
L'utilisateur de base de données configuré pour l'audit doit posséder des privilèges suffisants pour inspecter les catalogues systèmes, interroger l'état des configurations globales et exécuter des fonctions d'analyse.
- **Rôle recommandé** : `SUPERUSER` (par exemple le compte par défaut `postgres`) ou un utilisateur disposant du rôle prédéfini `pg_monitor` avec des droits d'accès en lecture sur la table système `pg_authid`.
- *Note* : Si vous utilisez un utilisateur sans privilèges d'administration, certains contrôles (ex: vérification des mots de passe chiffrés ou accès à `pg_authid`) remonteront des échecs liés à des permissions insuffisantes.

---

## 2. Moyens de connexion à la base de données

Le script d'audit (`audit_postgres15.sh`) s'appuie sur la bibliothèque cliente standard de PostgreSQL. Vous pouvez lui transmettre vos paramètres de connexion de trois manières complémentaires :

### Méthode A : Variables d'environnement standard (Recommandée)
Vous pouvez configurer les variables d'environnement de connexion dans votre terminal avant de lancer le script :

```bash
export PGHOST="localhost"          # Adresse IP ou hôte du serveur PostgreSQL
export PGPORT="5432"               # Port réseau de l'instance (défaut : 5432)
export PGUSER="postgres"           # Utilisateur PostgreSQL doté de droits d'audit
export PGDATABASE="postgres"       # Base de données d'audit de référence
export PGPASSWORD="votre_mot_de_passe" # Facultatif : Mot de passe de connexion
export PGDATA="/var/lib/postgresql/data" # Facultatif : Chemin physique PGDATA pour l'audit OS
```

### Méthode B : Authentification sécurisée par fichier `~/.pgpass`
Pour éviter de stocker ou d'afficher votre mot de passe en clair dans l'historique ou dans vos variables d'environnement, utilisez le fichier standard de mots de passe PostgreSQL `~/.pgpass` :

1. Créez ou modifiez le fichier sur votre machine d'audit :
   ```bash
   nano ~/.pgpass
   ```
2. Ajoutez la ligne au format suivant (remplacez par vos valeurs) :
   ```text
   hostname:port:database:username:password
   # Exemple :
   localhost:5432:postgres:postgres:MonMotDePasseSecurise123!
   ```
3. Appliquez des permissions de lecture exclusives strictes (requis par PostgreSQL sous peine d'être ignoré) :
   ```bash
   chmod 0600 ~/.pgpass
   ```

### Méthode C : Connexion locale par Socket Unix (Peer Authentication)
Si vous exécutez l'audit directement sur le serveur Linux hébergeant la base de données, vous pouvez utiliser les sockets Unix sans mot de passe via le mécanisme d'authentification par les pairs (`peer`) :

1. Connectez-vous sous le compte système `postgres` :
   ```bash
   sudo su - postgres
   ```
2. Exécutez directement le script d'audit (qui se connectera par défaut via la socket Unix `/var/run/postgresql`) :
   ```bash
   bash /chemin/vers/audit_postgres15.sh
   ```

---

## 3. Guide d'exécution de l'audit pas à pas

### Étape 1 : Récupération du script
Téléchargez le script d'audit officiel `audit_postgres15.sh` fourni par le portail d'audit :
```bash
wget -O audit_postgres15.sh http://<adresse-du-portail>/audit_postgres15.sh
# Ou téléchargez-le directement via le bouton de téléchargement du portail.
```

### Étape 2 : Attribution des droits d'exécution
Rendez le script exécutable dans votre terminal :
```bash
chmod +x audit_postgres15.sh
```

### Étape 3 : Exécution du script
Lancez l'audit en configurant vos variables ou en laissant les valeurs par défaut (localhost/postgres) :
```bash
# Exemple avec variables en ligne :
PGHOST="127.0.0.1" PGPORT="5432" PGUSER="postgres" PGDATABASE="postgres" ./audit_postgres15.sh
```

---

## 4. Analyse et Pilotage des résultats

Une fois l'exécution terminée, le script affiche un résumé synthétique dans le terminal et génère un fichier de rapport d'audit exhaustif nommé : **`cis_audit_report.md`**.

### Structure du Rapport (`cis_audit_report.md`)
Le rapport est structuré au format Markdown pour être facilement partagé, converti ou intégré dans vos outils de pilotage de conformité (Jira, Confluence, etc.) :
1. **Résumé Exécutif** : Contient votre taux de conformité global sous forme de score en pourcentage ainsi que la répartition statistique des statuts de contrôle.
2. **Détail des Contrôles** : Chaque contrôle analysé possède un statut visuel clair :
   - 🟢 **CONFORME** : Votre paramètre respecte strictement les recommandations de sécurité CIS.
   - 🔴 **NON CONFORME** : Une défaillance ou une vulnérabilité a été identifiée. Une action corrective immédiate est nécessaire.
   - 🟡 **A VERIFIER** : Le contrôle est de nature organisationnelle ou requiert une analyse contextuelle personnalisée par votre RSSI ou votre administrateur DBA.

### Conversion du rapport en PDF
Vous pouvez facilement convertir le rapport d'audit Markdown en PDF propre pour présentation à votre direction informatique ou vos auditeurs tiers :
```bash
# Nécessite pandoc et weasyprint ou texlive
pandoc cis_audit_report.md -o Rapport_Audit_PostgreSQL15_CIS.pdf --pdf-engine=weasyprint
```

---

## 5. Comment charger les résultats d'audit dans l'application web

En plus du rapport Markdown (`cis_audit_report.md`), le script d'audit génère automatiquement un fichier léger structuré nommé **`audit_result.json`** dans le dossier d'exécution.

Pour charger ces résultats réels directement dans l'interface graphique :

1. Ouvrez l'**Application Web d'Audit Portal**.
2. Accédez à l'onglet **Checklist Interactive** (Matrice d'évaluation).
3. Cliquez sur le bouton violet **"Importer audit_result.json"** situé en haut à droite.
4. Sélectionnez le fichier `audit_result.json` qui a été généré sur votre serveur de base de données.
5. **Résultat immédiat** : L'interface graphique va automatiquement importer tous les résultats réels de conformité (Conforme, Échec, À vérifier) ! Le tableau de bord statistique (Dashboard), les graphiques circulaires et les indicateurs se mettront à jour instantanément pour refléter l'état exact de votre serveur PostgreSQL 15.

---

## 6. Comment installer l'application depuis GitHub pour une exécution locale

Si vous souhaitez exécuter cette interface de pilotage directement sur la machine d'audit ou sur votre propre ordinateur (sans passer par internet), vous pouvez cloner le dépôt et lancer le serveur web localement.

### Étape A : Prérequis d'installation locale
Assurez-vous d'avoir installé sur votre machine :
- **Git** ([Télécharger Git](https://git-scm.com/))
- **Node.js** v18 ou version supérieure ([Télécharger Node.js](https://nodejs.org/))

### Étape B : Clonage et Installation du Dépôt
Ouvrez votre terminal ou invite de commande et exécutez les instructions suivantes :

```bash
# 1. Cloner le projet GitHub
git clone https://github.com/votre-compte/cis-postgres-audit-portal.git

# 2. Se positionner dans le répertoire du projet
cd cis-postgres-audit-portal

# 3. Installer l'ensemble des dépendances nécessaires
npm install
```

### Étape C : Lancement de l'Interface Graphique Locale
Démarrez le serveur de développement local :
```bash
npm run dev
```

Une fois démarré, le terminal affichera un message similaire à celui-ci :
```text
  VITE v5.x.x  ready in 450 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Étape D : Accès et Utilisation
1. Ouvrez votre navigateur internet préféré (Chrome, Firefox, Edge, Safari).
2. Saisissez l'adresse : **`http://localhost:3000`**
3. Vous disposez de l'interface graphique complète en local pour importer vos fichiers `audit_result.json`, naviguer dans les 83 contrôles CIS et exporter vos rapports au format Excel ou Markdown sans aucune connexion internet requise.

