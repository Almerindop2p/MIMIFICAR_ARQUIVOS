<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['filename']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados incompletos']);
        exit;
    }
    
    $filename = $input['filename'];
    $content = $input['content'];
    
    // Gera um nome único para o arquivo
    $uniqueName = uniqid() . '_' . $filename;
    $filePath = 'uploads/' . $uniqueName;
    
    // Garante que o diretório existe
    if (!is_dir('uploads')) {
        mkdir('uploads', 0755, true);
    }
    
    // Salva o arquivo
    if (file_put_contents($filePath, $content)) {
        echo json_encode([
            'success' => true,
            'downloadUrl' => $filePath,
            'filename' => $filename
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao salvar arquivo']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
}
?>