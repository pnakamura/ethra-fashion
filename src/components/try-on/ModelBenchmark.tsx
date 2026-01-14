import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Sparkles, 
  Crown, 
  Play, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  RotateCcw,
  ImageIcon,
  AlertTriangle,
  StopCircle,
  Shirt,
  Trophy,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WardrobeSelector } from './WardrobeSelector';

interface BenchmarkModel {
  id: string;
  name: string;
  icon: typeof Zap;
  color: string;
  description: string;
  apiProvider: 'replicate' | 'lovable' | 'google-cloud';
}

interface ModelResult {
  model: string;
  status: "success" | "failed" | "skipped";
  error?: string;
  resultImageUrl?: string;
  processingTimeMs?: number;
  cost?: string;
}

interface BenchmarkResponse {
  success: boolean;
  category: string;
  results: ModelResult[];
  totalTimeMs: number;
  summary: {
    success: number;
    failed: number;
    skipped: number;
    fastestModel: string | null;
  };
}

const BENCHMARK_MODELS: BenchmarkModel[] = [
  {
    id: 'idm-vton',
    name: 'IDM-VTON',
    icon: Sparkles,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    description: 'Replicate - Especializado VTO',
    apiProvider: 'replicate'
  },
  {
    id: 'seedream-4.5',
    name: 'Seedream 4.5',
    icon: Crown,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    description: 'ByteDance - Alta qualidade',
    apiProvider: 'replicate'
  },
  {
    id: 'seedream-4.0',
    name: 'Seedream 4.0',
    icon: Sparkles,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    description: 'ByteDance - Balanceado',
    apiProvider: 'replicate'
  },
  {
    id: 'vertex-ai',
    name: 'Vertex AI Imagen',
    icon: Crown,
    color: 'text-green-500 bg-green-500/10 border-green-500/30',
    description: 'Google Cloud - Alta fidelidade',
    apiProvider: 'google-cloud'
  },
  {
    id: 'gemini',
    name: 'Gemini 3 Pro',
    icon: Zap,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    description: 'Lovable AI - Incluído',
    apiProvider: 'lovable'
  },
] as const;

// Timeout constants
const BENCHMARK_TIMEOUT_MS = 180000; // 3 minutes

interface ModelBenchmarkProps {
  avatarImageUrl?: string;
  onSelectResult?: (imageUrl: string, model: string) => void;
}

export function ModelBenchmark({ avatarImageUrl, onSelectResult }: ModelBenchmarkProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>(['idm-vton', 'seedream-4.5', 'vertex-ai', 'gemini']);
  const [garmentUrl, setGarmentUrl] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkResponse | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showWardrobeSelector, setShowWardrobeSelector] = useState(false);
  const [selectedClosetItem, setSelectedClosetItem] = useState<{ id: string; name: string } | null>(null);
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer during benchmark
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 100);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    );
  };

  const cancelBenchmark = () => {
    abortControllerRef.current?.abort();
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setIsRunning(false);
    toast.info('Benchmark cancelado');
  };

  const runBenchmark = async () => {
    if (!avatarImageUrl) {
      toast.error('Configure um avatar primeiro');
      return;
    }

    if (selectedModels.length === 0) {
      toast.error('Selecione pelo menos um modelo');
      return;
    }

    // Use default garment if none provided
    const testGarmentUrl = garmentUrl.trim() || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600';

    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    setIsRunning(true);
    setProgress(10);
    setResults([]);
    setBenchmarkSummary(null);
    setElapsedTime(0);

    // Set global timeout (3 minutes)
    timeoutIdRef.current = setTimeout(() => {
      abortControllerRef.current?.abort();
      toast.error('Timeout: O benchmark demorou mais de 3 minutos');
      setIsRunning(false);
    }, BENCHMARK_TIMEOUT_MS);

    try {
      // Simulate progress updates
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 85));
      }, 2000);

      const { data, error } = await supabase.functions.invoke('test-vto-models', {
        body: {
          avatarImageUrl,
          garmentImageUrl: testGarmentUrl,
          category: 'upper_body',
          models: selectedModels,
        },
      });

      // Cleanup timers
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      
      setProgress(100);

      if (error) {
        throw error;
      }

      const response = data as BenchmarkResponse;
      setResults(response.results);
      setBenchmarkSummary(response);
      
      toast.success(`Benchmark concluído: ${response.summary.success}/${response.results.length} modelos bem-sucedidos`);
    } catch (error: any) {
      // Cleanup timers on error
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      
      console.error('Benchmark error:', error);
      
      if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        // Already handled by timeout or cancel
      } else {
        toast.error('Erro ao executar benchmark');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const resetBenchmark = () => {
    setResults([]);
    setBenchmarkSummary(null);
    setProgress(0);
    setElapsedTime(0);
  };

  // Normalize model IDs from backend to match frontend
  const getModelInfo = (modelId: string) => {
    // Normalize legacy IDs from backend
    let normalizedId = modelId;
    if (modelId === 'vertex-ai-imagen') normalizedId = 'vertex-ai';
    if (modelId === 'gemini-3-pro-image-preview') normalizedId = 'gemini';
    
    const found = BENCHMARK_MODELS.find(m => m.id === normalizedId);
    if (found) return found;
    
    // Safe fallback
    return {
      id: modelId,
      name: modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: Zap,
      color: 'text-gray-500 bg-gray-500/10 border-gray-500/30',
      description: 'Modelo',
      apiProvider: 'replicate' as const
    };
  };

  // Calculate total cost from results
  const calculateTotalCost = () => {
    return results
      .filter(r => r.status === 'success')
      .reduce((sum, r) => {
        const cost = parseFloat((r.cost || '$0.00').replace('$', '').replace(' (included)', ''));
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-xl text-gradient mb-1">Benchmark de Modelos</h2>
        <p className="text-xs text-muted-foreground">
          Compare diferentes IAs de prova virtual lado a lado
        </p>
      </div>

      {/* Model Selection */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Modelos para Comparar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {BENCHMARK_MODELS.map((model) => {
            const Icon = model.icon;
            const isSelected = selectedModels.includes(model.id);
            
            return (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id)}
                disabled={isRunning}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                  isSelected 
                    ? model.color + " border-2"
                    : "bg-secondary/30 border-border/50 hover:bg-secondary/50",
                  isRunning && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isSelected ? "bg-background" : "bg-secondary"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected && model.color.split(' ')[0])} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{model.name}</p>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 opacity-60">
                      {model.apiProvider === 'replicate' ? (
                        <><ExternalLink className="w-2.5 h-2.5 mr-0.5" /> Replicate</>
                      ) : model.apiProvider === 'google-cloud' ? (
                        <><ExternalLink className="w-2.5 h-2.5 mr-0.5" /> Google Cloud</>
                      ) : (
                        'Lovable AI'
                      )}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{model.description}</p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 transition-colors",
                  isSelected 
                    ? "bg-primary border-primary" 
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && (
                    <CheckCircle2 className="w-full h-full text-primary-foreground" />
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Garment Selection */}
      <Card className="border-border/50">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">
              Roupa para testar
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWardrobeSelector(true)}
              disabled={isRunning}
              className="h-7 text-xs"
            >
              <Shirt className="w-3 h-3 mr-1.5" />
              Usar do closet
            </Button>
          </div>
          
          {selectedClosetItem ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Shirt className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium flex-1">{selectedClosetItem.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setSelectedClosetItem(null);
                  setGarmentUrl('');
                }}
              >
                Limpar
              </Button>
            </div>
          ) : (
            <input
              type="url"
              value={garmentUrl}
              onChange={(e) => setGarmentUrl(e.target.value)}
              placeholder="Cole URL da imagem ou selecione do closet"
              disabled={isRunning}
              className="w-full px-3 py-2 text-sm rounded-lg bg-secondary/50 border border-border focus:border-primary focus:outline-none disabled:opacity-50"
            />
          )}
          
          {!garmentUrl && !selectedClosetItem && (
            <p className="text-[10px] text-muted-foreground">
              Uma roupa padrão será usada se nenhuma for selecionada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Wardrobe Selector Sheet */}
      <Sheet open={showWardrobeSelector} onOpenChange={setShowWardrobeSelector}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader className="mb-4">
            <SheetTitle>Selecionar do Closet</SheetTitle>
          </SheetHeader>
          <WardrobeSelector
            onSelect={(item) => {
              setGarmentUrl(item.imageUrl);
              setSelectedClosetItem({ id: item.id, name: item.name || item.category });
              setShowWardrobeSelector(false);
              toast.success(`${item.name || item.category} selecionado`);
            }}
            selectedId={selectedClosetItem?.id}
          />
        </SheetContent>
      </Sheet>

      {/* Avatar Warning */}
      {!avatarImageUrl && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Configure um avatar acima para executar o benchmark
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isRunning ? (
          <>
            <Button
              disabled
              className="flex-1 h-12 bg-secondary text-secondary-foreground cursor-wait"
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando... {(elapsedTime / 1000).toFixed(1)}s
            </Button>
            <Button
              onClick={cancelBenchmark}
              variant="destructive"
              className="h-12 px-4"
            >
              <StopCircle className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <Button
            onClick={results.length > 0 ? resetBenchmark : runBenchmark}
            disabled={!avatarImageUrl || selectedModels.length === 0}
            className={cn(
              "w-full h-12",
              results.length > 0
                ? "bg-secondary hover:bg-secondary/80"
                : "gradient-primary text-primary-foreground"
            )}
          >
            {results.length > 0 ? (
              <>
                <RotateCcw className="w-5 h-5 mr-2" />
                Novo Benchmark
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Iniciar Benchmark
              </>
            )}
          </Button>
        )}
      </div>

      {/* Progress */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Aguarde, processando em paralelo...
              </p>
              <p className="text-xs text-muted-foreground">
                Timeout: {Math.max(0, Math.floor((BENCHMARK_TIMEOUT_MS - elapsedTime) / 1000))}s
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            {benchmarkSummary && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-green-500 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {benchmarkSummary.summary.success} OK
                      </Badge>
                      {benchmarkSummary.summary.failed > 0 && (
                        <Badge variant="outline" className="text-red-500 border-red-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          {benchmarkSummary.summary.failed} Falha
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {(benchmarkSummary.totalTimeMs / 1000).toFixed(1)}s total
                    </div>
                  </div>
                  {benchmarkSummary.summary.fastestModel && (
                    <p className="text-xs text-primary mt-2">
                      🏆 Mais rápido: {getModelInfo(benchmarkSummary.summary.fastestModel).name}
                    </p>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Comparative Time Chart */}
          {benchmarkSummary && results.filter(r => r.status === 'success').length > 1 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Comparativo de Tempo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results
                  .filter(r => r.status === 'success')
                  .sort((a, b) => (a.processingTimeMs || 0) - (b.processingTimeMs || 0))
                  .map((result, index) => {
                    const maxTime = Math.max(...results.filter(r => r.status === 'success').map(r => r.processingTimeMs || 0));
                    const percentage = maxTime > 0 ? ((result.processingTimeMs || 0) / maxTime) * 100 : 0;
                    const modelInfo = getModelInfo(result.model);
                    
                    return (
                      <div key={result.model} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {index === 0 && <Trophy className="w-3 h-3 text-primary" />}
                            {modelInfo.name}
                          </span>
                          <span className="text-muted-foreground">
                            {(result.processingTimeMs! / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className={cn(
                            "h-2",
                            index === 0 && "[&>div]:bg-primary"
                          )}
                        />
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* Cost Comparison Chart - NEW */}
          {benchmarkSummary && results.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Comparativo de Custos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Total estimated */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Custo Total do Benchmark
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${calculateTotalCost().toFixed(2)}
                  </span>
                </div>
                
                {/* Cost bars per model */}
                {results
                  .filter(r => r.cost && r.status !== 'skipped')
                  .sort((a, b) => {
                    const costA = parseFloat((a.cost || '0').replace('$', '').replace(' (included)', ''));
                    const costB = parseFloat((b.cost || '0').replace('$', '').replace(' (included)', ''));
                    return costB - costA;
                  })
                  .map((result) => {
                    const modelInfo = getModelInfo(result.model);
                    const costValue = parseFloat((result.cost || '0').replace('$', '').replace(' (included)', ''));
                    const maxCost = Math.max(
                      ...results
                        .filter(r => r.status !== 'skipped')
                        .map(r => parseFloat((r.cost || '0').replace('$', '').replace(' (included)', '')))
                    );
                    const percentage = maxCost > 0 ? (costValue / maxCost) * 100 : 0;
                    const isIncluded = result.cost?.includes('included');
                    const isSuccess = result.status === 'success';
                    
                    return (
                      <div key={result.model} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {modelInfo.name}
                            {isIncluded && (
                              <Badge variant="outline" className="text-[9px] px-1 text-green-500 border-green-500/30">
                                Incluído
                              </Badge>
                            )}
                            {!isSuccess && (
                              <Badge variant="outline" className="text-[9px] px-1 text-red-500 border-red-500/30">
                                Falhou
                              </Badge>
                            )}
                          </span>
                          <span className={cn(
                            "font-medium",
                            isIncluded ? "text-green-500" : "text-muted-foreground"
                          )}>
                            {result.cost || '$0.00'}
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className={cn(
                            "h-2",
                            isIncluded && "[&>div]:bg-green-500",
                            !isIncluded && isSuccess && "[&>div]:bg-amber-500",
                            !isSuccess && "[&>div]:bg-red-500/50"
                          )}
                        />
                      </div>
                    );
                  })}
                  
                {/* Legend */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Lovable AI (sem custo extra)
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    APIs externas (custo por uso)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

            {/* Results Cards */}
            <div className="grid gap-4">
              {results.map((result, index) => {
                const modelInfo = getModelInfo(result.model);
                const Icon = modelInfo.icon;
                const isFastest = benchmarkSummary?.summary.fastestModel === result.model;
                const isSuccess = result.status === "success";
                const isIncludedCost = result.cost?.includes('included');
                
                return (
                  <motion.div
                    key={result.model}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "overflow-hidden transition-all",
                      isSuccess 
                        ? isFastest 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border/50"
                        : "border-red-500/30 bg-red-500/5"
                    )}>
                      {/* Model Header */}
                      <div className={cn(
                        "flex items-center gap-3 p-3 border-b",
                        modelInfo.color
                      )}>
                        <Icon className="w-5 h-5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{modelInfo.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isFastest && (
                            <Badge className="bg-primary text-primary-foreground text-[10px]">
                              🏆 Mais rápido
                            </Badge>
                          )}
                          {isSuccess && result.processingTimeMs && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {(result.processingTimeMs / 1000).toFixed(1)}s
                            </Badge>
                          )}
                          {/* Cost Badge - NEW */}
                          {result.cost && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                isIncludedCost 
                                  ? "text-green-500 border-green-500/30"
                                  : "text-amber-500 border-amber-500/30"
                              )}
                            >
                              <DollarSign className="w-3 h-3 mr-0.5" />
                              {result.cost.replace(' (included)', '')}
                            </Badge>
                          )}
                          {!isSuccess && (
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              Falhou
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Result Image or Error */}
                      <CardContent className="p-0">
                        {isSuccess && result.resultImageUrl ? (
                          <div className="relative group">
                            <img
                              src={result.resultImageUrl}
                              alt={`Resultado ${modelInfo.name}`}
                              className="w-full h-auto max-h-[400px] object-contain bg-secondary/30"
                            />
                            {/* Overlay actions on hover */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <Button
                                size="sm"
                                onClick={() => onSelectResult?.(result.resultImageUrl!, result.model)}
                                className="gradient-primary"
                              >
                                Usar Este
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(result.resultImageUrl, '_blank')}
                              >
                                Abrir
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <XCircle className="w-12 h-12 text-red-500/50 mx-auto mb-3" />
                            <p className="text-sm text-red-500 font-medium">Erro no processamento</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                              {result.error || 'Falha desconhecida'}
                            </p>
                            {/* Rate limit specific message */}
                            {result.error?.toLowerCase().includes('rate limit') && (
                              <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  ⏳ Rate limit temporário do Replicate. O sistema tentou retry automático mas o limite persistiu. Tente novamente em alguns segundos.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isRunning && results.length === 0 && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Selecione os modelos e clique em "Iniciar Benchmark" para comparar resultados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
