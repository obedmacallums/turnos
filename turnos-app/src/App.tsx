import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { DiaconosTable } from './components/diaconos/DiaconosTable';
import { ScheduleGenerator } from './components/schedule/ScheduleGenerator';
import { ScheduleView } from './components/schedule/ScheduleView';
import { InteractiveView } from './components/interactive/InteractiveView';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Gestión de Turnos de Diáconos
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistema de asignación automática de turnos para sábados y miércoles
          </p>
        </div>

        <Tabs defaultValue="diaconos" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="diaconos">Diáconos</TabsTrigger>
            <TabsTrigger value="turnos">Generar Turnos</TabsTrigger>
            <TabsTrigger value="interactivo">Interactivo</TabsTrigger>
          </TabsList>

          <TabsContent value="diaconos" className="space-y-4">
            <DiaconosTable />
          </TabsContent>

          <TabsContent value="turnos" className="space-y-6">
            <ScheduleGenerator />
            <ScheduleView />
          </TabsContent>

          <TabsContent value="interactivo" className="space-y-6">
            <InteractiveView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
