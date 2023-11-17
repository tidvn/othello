// github:tom-weatherhead/thaw-reversi-engine.ts/src/player.ts
import { blackPlayerToken, boardArea, boardHeight, boardWidth, whitePlayerToken } from './board';
import { PlayerColour } from './player-colour';

export function getRandomArrayElement(array) {
    if (!array.length) {
        return undefined;
    }
    return array[Math.floor(Math.random() * array.length)];
}

export class Player {
    constructor(colour, game, piecePopulation) {
        let token;
        switch (colour) {
            case PlayerColour.White:
                token = whitePlayerToken;
                break;
            case PlayerColour.Black:
                token = blackPlayerToken;
                break;
            default:
                throw new Error(`Player constructor: Illegal PlayerColour '${PlayerColour[colour]}' (${colour})`);
        }
        this.colour = colour;
        this.piecePopulation = piecePopulation;
        this.token = token;
        // this.name = PlayerColour[colour];
        this.game = game;
        this.opponent = this;
    }
    // public get board(): Board {
    // 	return this.game.board;
    // }
    findBestMove(nPly, nParentScore = NaN, nBestUncleRecursiveScore = NaN) {
        // cắt tỉa alpha-beta.
        const returnObject = {
            bestColumn: NaN,
            bestMoves: [],
            bestRow: NaN,
            bestScore: NaN
            // , numberOfLegalMoves: 0
        };
        let nBestScore = NaN; // Điểm số tốt nhất
        let bestMoves = []; // Danh sách các nước đi tốt nhất
        let doneSearching = false; // Biến kiểm soát việc tìm kiếm
    
        // Duyệt qua từng hàng của bảng trò chơi
        for (let row = 0; row < boardHeight && !doneSearching; ++row) {
            // Duyệt qua từng cột của bảng trò chơi
            for (let column = 0; column < boardWidth; ++column) {
                const placePieceResult = this.game.board.placePiece(this, row, column); // Đặt quân cờ và lấy kết quả
                
                // Nếu không thể đặt quân cờ ở vị trí này, bỏ qua
                if (typeof placePieceResult === 'undefined') {
                    continue;
                }
                
                // Lấy điểm số từ kết quả đặt quân cờ
                let nScore = placePieceResult.score;
                console.log(this); 
                // Nếu quân đối thủ đã bị loại bỏ, gán điểm số bằng điểm chiến thắng
                if (this.opponent.piecePopulation === 0) {
                    nScore = this.game.victoryScore;
                }
                // Nếu độ sâu còn nhiều hơn 1 và tổng số quân cờ của cả hai người chơi chưa đầy bảng
                else if (nPly > 1 && this.piecePopulation + this.opponent.piecePopulation < boardArea) {
                    // Gọi đệ quy để tìm kiếm nước đi tốt nhất cho đối thủ
                    const childReturnObject = this.opponent.findBestMove(nPly - 1, nScore, nBestScore);
                    nScore -= childReturnObject.bestScore; // Trừ điểm số tốt nhất của đối thủ
                }
    
                // Đặt lại trạng thái ô của bảng trò chơi
                this.game.board.setSquareState(row, column, undefined);
    
                // Đảo ngược trạng thái của các ô đã bị lật
                for (const squareCoordinates of placePieceResult.flippedPieces) {
                    this.game.board.setSquareState(squareCoordinates.row, squareCoordinates.column, this.opponent);
                }
    
                // Cập nhật số lượng quân cờ của người chơi và đối thủ
                this.piecePopulation -= placePieceResult.flippedPieces.length + 1;
                this.opponent.piecePopulation += placePieceResult.flippedPieces.length;
    
                // Nếu điểm số tốt nhất chưa được gán hoặc điểm số hiện tại lớn hơn điểm số tốt nhất
                if (Number.isNaN(nBestScore) || nScore > nBestScore) {
                    nBestScore = nScore;
                    bestMoves = [];
                    bestMoves.push({ row, column });
    
                    // Cắt tỉa alpha-beta để giảm số lượng nút cần phải kiểm tra
                    if (!Number.isNaN(nParentScore) && !Number.isNaN(nBestUncleRecursiveScore) &&
                        nParentScore - nBestScore < nBestUncleRecursiveScore) {
                        // *** Ở đây là nơi cắt tỉa alpha-beta xảy ra ****
                        // Vì các tham số ban đầu cho nước đi ở cấp độ cao nhất, break không bao giờ được thực hiện ở đỉnh.
                        doneSearching = true; // Dừng tìm kiếm
                        break; // tức là return
                    }
                }
                // Nếu điểm số hiện tại bằng điểm số tốt nhất
                else if (nScore === nBestScore) {
                    bestMoves.push({ row, column });
                }
            }
        }
    
        // Chọn một nước đi tốt nhất từ mảng bestMoves
        const selectedBestMove = getRandomArrayElement(bestMoves);
    
        // Nếu có nước đi tốt nhất được chọn, cập nhật returnObject với thông tin về nước đi đó
        if (typeof selectedBestMove !== 'undefined') {
            returnObject.bestRow = selectedBestMove.row;
            returnObject.bestColumn = selectedBestMove.column;
        } else {
            nBestScore = 0; // Không có nước đi hợp lệ nào
        }
    
        // Cập nhật returnObject với điểm số tốt nhất và danh sách các nước đi tốt nhất
        returnObject.bestScore = nBestScore;
        returnObject.bestMoves = bestMoves;
    
        // Trả về đối tượng chứa thông tin về nước đi tốt nhất
        return returnObject;
    }
    
}
