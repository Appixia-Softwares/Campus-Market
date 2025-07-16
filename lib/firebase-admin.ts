import { initializeApp, cert, getApps, ServiceAccount, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '{"type":"service_account","project_id":"universestay-8c0e4","private_key_id":"7fed418b41fcec5dbaccc40a77e7e686df9140c1","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDdGwDK5/xO+FhP\\nEtgWOwnoBiP/JIWRuwl4RzdHzFf/Ok20+vPufvNo/NPjEhz7oG2wo6dLEY8pF644\\nrTTX5j7HMHzrRpgtPH3EyVnxsWUJ6JtPN4OtGQXXq0DXZdvAK5/C3s/tOeOTazev\\nYCx21tgL2mrun/N5RO0sgvlN6NHZc9EMOcOXR01dka9So1RpLax/nf0zXIxEBlWQ\\nYMFt5XI9L4UrQzvLzdeJNPc1K1qFRd4n1a6weLymhSDPYo6pihi6XCLMDkZVzywz\\ntYz0AF5N5TvIY61MWtN1edKM2ZX3udMHlsZP0BnW5mRc3mFBmzfoXsoQdUM9B5gJ\\nOHSXmrKLAgMBAAECggEANZEUtJPWgzVUg7e/hUdBY6aVMvugpolHRo4OXQUrLojs\\nCZQg4996zi0ukl0xi163JGvJnHzBD8YObem8my/LdsuPABsmxBLbL4FOmqkNHwTt\\nF5iN/LJKwZDaUTT6s8h92KLNgh4bvfvkTkdBDnuHdPuyG2TCAlfKFBYZGyB0MreS\\nnpR3FW4BNe3HNdi8p/Q/dY7SJMo3xVeousVTzLAioN5v8c+fr/WK6f/LlLY9u2pP\\naYbnUlCOgalmmCiHLbj4MwFkUwXi879GCRwYuXQdhe0V4EHcU9L8bexjhw79bLvC\\nuruR8dyR6bs7L0fCqLQZC7pKyL9S9EckkEjSMp7SzQKBgQDu6V2F8BR4XdJKy9ZQ\\n2hZnc5imxiNUFVpXiETe8OiC8VCwnuO+9Kfg0UoaUogfwb5GHjqwHXqE8CKgVrDP\\nxG3PMb36wE3ekZfWLwbc2H6sc7BOoGMeMbvMOhjRJosuI666gOdwhgCAFpB0ydYP\\ngPMLaSVi3llhxwKcx5nDzwYjlwKBgQDs65iJLVHsgABy03f6kzplYrpswX6z1QCf\\nhGVE+mGQavrEY32rt88FJfLRhrZxCGRoQiEQNbBJr8Jwtbg2vIqhGboypgBNjj9S\\nE/cb6oKS5xqPR7BiQO769qXJ87NWr3r+PKhHOt5I3PoGhqBbOcWo2hMLlOlg+s1y\\nYrUBdUc3LQKBgHmzFpjruwG1iTHgs8Nr1I3OLKyHsedbGTINkEegoFBTbK8LwSe8\\nqOe0tPLDp+PFZY+CRpL/8TFWwcy7XEX54ZXx2LyqyP/fWmEYg35sKdre86iZuuPe\\nobNexNWFtNBEDPWkREDlgcu9sshLKGetYCEn5ot+iDlujr4eTw2Xn6DxAoGBAJ5+\\nwg3LHspLm4E1zUb5pZBb6wGEtMGTlpYgmSr7IbfeiaJGOLVfAwSbrYTUTUry5VEG\\nJF5WvHefOEH0n6cmnMtHjdQCT6OSrPO43ZB0YyPprU/7Epm4fOexh5nCCdDNFkfs\\nxlrYnAo8opspBy/gR0Y9lY4i8bnqLvT96b9u+NSFAoGBAI3iUHQSfsTBT9EZc82z\\n+l8waYn8996y+ViMJyvT1+tCupWqKt4SQypiPtSEcf/uE/3ZoUKTWgg+8Jr1A9VG\\n49dve6VZm3Sk+M6d6t+hZFpmfjZemVSrWL0E74uHKXg6q8JcN3xcx2cJJaLXs37u\\nPdzvfcdU3kLTeYOUWU6NSSfi\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-gdovy@universestay-8c0e4.iam.gserviceaccount.com","client_id":"113478679982108526456","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-gdovy%40universestay-8c0e4.iam.gserviceaccount.com","universe_domain":"googleapis.com"}',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
} as ServiceAccount;

let app: App;
if (!getApps().length) {
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = getApps()[0];
}

export const adminDb = getFirestore(app);
export const adminMessaging = getMessaging(app); 