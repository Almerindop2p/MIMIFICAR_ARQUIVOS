<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['code']) || !isset($input['type']) || !isset($input['options'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    $code = $input['code'];
    $type = $input['type'];
    $options = $input['options'];
    
    try {
        $minifiedCode = minifyCode($code, $type, $options);
        
        echo json_encode([
            'success' => true,
            'minifiedCode' => $minifiedCode,
            'originalSize' => strlen($code),
            'minifiedSize' => strlen($minifiedCode),
            'reduction' => calculateReduction(strlen($code), strlen($minifiedCode))
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro na minificação: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
}

function minifyCode($code, $type, $options) {
    $minified = $code;
    
    // Remove comentários
    if ($options['removeComments']) {
        switch ($type) {
            case 'html':
                $minified = preg_replace('/<!--[\s\S]*?-->/', '', $minified);
                break;
            case 'css':
                $minified = preg_replace('/\/\*[\s\S]*?\*\//', '', $minified);
                break;
            case 'js':
                $minified = preg_replace('/\/\/.*$/m', '', $minified);
                $minified = preg_replace('/\/\*[\s\S]*?\*\//', '', $minified);
                break;
        }
    }
    
    // Remove espaços extras
    if ($options['removeSpaces']) {
        $minified = preg_replace('/\s+/', ' ', $minified);
        
        if ($type === 'html') {
            $minified = preg_replace('/>\s+</', '><', $minified);
        } elseif ($type === 'css') {
            $minified = preg_replace('/\s*{\s*/', '{', $minified);
            $minified = preg_replace('/\s*}\s*/', '}', $minified);
            $minified = preg_replace('/\s*;\s*/', ';', $minified);
            $minified = preg_replace('/\s*:\s*/', ':', $minified);
            $minified = preg_replace('/\s*,\s*/', ',', $minified);
        }
    }
    
    // Remove quebras de linha
    if ($options['removeLineBreaks']) {
        $minified = str_replace(["\n", "\r", "\t"], '', $minified);
    }
    
    return trim($minified);
}

function calculateReduction($original, $minified) {
    if ($original === 0) return 0;
    return round((($original - $minified) / $original) * 100, 2);
}
?>