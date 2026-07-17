import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase Config from environment variables with fallback values
export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "macro-courier-jdw77",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:845629454968:web:3f8c40ac789625cc9f8b8d",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCyri_GTTHrIoT-QLu2NSYHT0HMYczhhTY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "macro-courier-jdw77.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-3cf6de32-0d19-4630-9c6a-8f90804d0466",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "macro-courier-jdw77.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "845629454968"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

/**
 * Validates connection to Firestore as per SKILL guidelines
 */
export async function testConnection() {
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDoc(testDocRef);
    console.log("Firebase Connection verified successfully.");
  } catch (error) {
    console.error("Please check your Firebase configuration:", error);
  }
}

/**
 * Seeds initial database data for EJC drivers and encontristas if empty.
 * This ensures the user has immediate access to mock/real data for verification.
 */
export async function seedDatabaseIfEmpty() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (usersSnapshot.empty) {
      console.log("Seeding Firestore with EJC users and encontristas...");

      // Seed Users
      const initialUsers = [
        {
          id: "user_joao",
          name: "João Silva (Tio João)",
          phone: "11999999999",
          assignedEncontristas: ["enc_1", "enc_2", "enc_3"]
        },
        {
          id: "user_maria",
          name: "Maria Souza (Tia Maria)",
          phone: "11988888888",
          assignedEncontristas: ["enc_4", "enc_5"]
        },
        {
          id: "user_pedro",
          name: "Pedro Santos (Tio Pedro)",
          phone: "21977777777",
          assignedEncontristas: ["enc_6"]
        }
      ];

      for (const u of initialUsers) {
        await setDoc(doc(db, 'users', u.id), {
          name: u.name,
          phone: u.phone,
          assignedEncontristas: u.assignedEncontristas
        });
      }

      // Seed Encontristas
      const initialEncontristas = [
        {
          id: "enc_1",
          name: "Lucas Gabriel Costa Santos",
          phone: "(11) 91234-5678",
          medication: "Dipirona se tiver dor de cabeça",
          disability: "Nenhuma",
          observations: "Levar casaco preto que ele esqueceu no refeitório.",
          address: "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP",
          complement: "Apto 42B",
          additionalPhones: "Mãe (Clara): (11) 98765-4321, Pai (Roberto): (11) 97654-3210"
        },
        {
          id: "enc_2",
          name: "Beatriz Oliveira Lima",
          phone: "(11) 92345-6789",
          medication: "Ritalina pela manhã",
          disability: "TDAH acentuado",
          observations: "Bastante tímida. Prefere viajar no banco de trás.",
          address: "Rua Augusta, 1500 - Consolação, São Paulo - SP",
          complement: "Bloco C, Casa 3",
          additionalPhones: "Irmã (Ana): (11) 96543-2109"
        },
        {
          id: "enc_3",
          name: "Mateus Henrique Alves",
          phone: "(11) 93456-7890",
          medication: "Nenhuma",
          disability: "Nenhuma",
          observations: "Pode ser deixado com o porteiro do prédio (Seu Agenor) caso os pais não estejam.",
          address: "Rua Vergueiro, 2500 - Vila Mariana, São Paulo - SP",
          complement: "Torre Sul, Apto 112",
          additionalPhones: "Tia (Sônia): (11) 95432-1098"
        },
        {
          id: "enc_4",
          name: "Larissa Fernandes Melo",
          phone: "(11) 94567-8901",
          medication: "Bombinha de asma em caso de crise",
          disability: "Nenhuma",
          observations: "Evitar ar-condicionado muito forte se possível.",
          address: "Avenida Brigadeiro Luís Antônio, 3000 - Jardim Paulista, São Paulo - SP",
          complement: "Sem complemento",
          additionalPhones: "Mãe (Regina): (11) 94321-0987"
        },
        {
          id: "enc_5",
          name: "Gabriel Vinícius Souza",
          phone: "(11) 95678-9012",
          medication: "Nenhuma",
          disability: "Deficiência visual parcial (usa óculos fortes)",
          observations: "Ajudar a carregar a mochila vermelha e preta.",
          address: "Alameda Lorena, 800 - Cerqueira César, São Paulo - SP",
          complement: "Apto 15, Bloco B",
          additionalPhones: "Pai (Marcos): (11) 93210-9876"
        },
        {
          id: "enc_6",
          name: "Thiago Rocha Azevedo",
          phone: "(21) 96789-0123",
          medication: "Nenhuma",
          disability: "Nenhuma",
          observations: "Levar de volta até a paróquia se a família não estiver em casa.",
          address: "Avenida Atlântica, 1200 - Copacabana, Rio de Janeiro - RJ",
          complement: "Cobertura 01",
          additionalPhones: "Mãe (Lúcia): (21) 92109-8765"
        }
      ];

      for (const e of initialEncontristas) {
        await setDoc(doc(db, 'encontristas', e.id), {
          name: e.name,
          phone: e.phone,
          medication: e.medication,
          disability: e.disability,
          observations: e.observations,
          address: e.address,
          complement: e.complement,
          additionalPhones: e.additionalPhones
        });
      }
      console.log("Firestore seeding completed successfully.");
    } else {
      console.log("Firestore is already seeded with users & encontristas.");
    }

    // Seed Tasks if empty
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    if (tasksSnapshot.empty) {
      console.log("Seeding initial logistics tasks...");
      const initialTask = {
        title: "Buscar mensagens do saco de choro na casa da mãe",
        description: "Coletar com carinho as cartas/mensagens preparadas pela família na residência materna para o momento do saco de choro no domingo.",
        status: "pending",
        assignedTo: "all",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'tasks', 'task_initial_1'), initialTask);
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}

export { db, auth };
